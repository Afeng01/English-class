from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, BackgroundTasks
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import tempfile
import shutil
import logging

from app.models.database import get_db, Book, Chapter, BookVocabulary
from app.schemas.schemas import (
    BookResponse,
    BookDetailResponse,
    ChapterResponse,
    VocabularyResponse,
    BookDuplicateCheck,
    BookDuplicateResponse,
    BookDuplicateInfo,
)
from app.utils.oss_helper import oss_helper
from app.utils.supabase_client import supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()

# 难度等级选项
LEVEL_OPTIONS = [
    "学前", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
    "初一", "初二", "初三", "高一", "高二", "高三"
]


def _normalize_text(value: Optional[str]) -> str:
    """统一处理字符串比较：去除首尾空格并转为小写"""
    return (value or "").strip().lower()


def _build_duplicate_info(book_source) -> BookDuplicateInfo:
    """将Supabase或SQLite返回的书籍对象转换为响应结构"""
    if isinstance(book_source, Book):
        return BookDuplicateInfo(
            id=book_source.id,
            title=book_source.title,
            author=book_source.author,
            cover=book_source.cover,
        )
    return BookDuplicateInfo(
        id=book_source.get("id"),
        title=book_source.get("title"),
        author=book_source.get("author"),
        cover=book_source.get("cover"),
    )


@router.get("", response_model=List[BookResponse])
async def get_books(
    level: Optional[str] = Query(None, description="按难度等级筛选"),
    search: Optional[str] = Query(None, description="搜索书名"),
    db: Session = Depends(get_db)
):
    """获取书籍列表（优先使用Supabase，备选SQLite）"""
    # 优先使用Supabase
    if supabase_client.enabled:
        try:
            books_data = supabase_client.list_books(level=level, search=search)
            logger.info(f"✅ 从Supabase获取书籍列表: {len(books_data)} 本")
            return books_data
        except Exception as e:
            logger.error(f"⚠️ Supabase查询失败，回退到SQLite: {e}")

    # 回退到SQLite
    query = db.query(Book)

    if level:
        query = query.filter(Book.level == level)
    if search:
        query = query.filter(Book.title.ilike(f"%{search}%"))

    books = query.order_by(Book.created_at.desc()).all()
    logger.info(f"从SQLite获取书籍列表: {len(books)} 本")
    return books


@router.get("/{book_id}", response_model=BookDetailResponse)
async def get_book(book_id: str, db: Session = Depends(get_db)):
    """获取书籍详情（优先使用Supabase，备选SQLite）"""
    # 优先使用Supabase
    if supabase_client.enabled:
        try:
            book_data = supabase_client.get_book(book_id)
            if book_data:
                logger.info(f"✅ 从Supabase获取书籍详情: {book_data.get('title')}")
                return book_data
        except Exception as e:
            logger.error(f"⚠️ Supabase查询失败，回退到SQLite: {e}")

    # 回退到SQLite
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    logger.info(f"从SQLite获取书籍详情: {book.title}")
    return book


@router.get("/{book_id}/chapters", response_model=List[ChapterResponse])
async def get_book_chapters(book_id: str, db: Session = Depends(get_db)):
    """获取书籍章节列表（优先使用Supabase，备选SQLite）"""
    # 优先使用Supabase
    if supabase_client.enabled:
        try:
            chapters_data = supabase_client.get_chapters(book_id)
            logger.info(f"✅ 从Supabase获取章节列表: {len(chapters_data)} 章")
            return chapters_data
        except Exception as e:
            logger.error(f"⚠️ Supabase查询失败，回退到SQLite: {e}")

    # 回退到SQLite
    chapters = db.query(Chapter).filter(
        Chapter.book_id == book_id
    ).order_by(Chapter.chapter_number).all()
    logger.info(f"从SQLite获取章节列表: {len(chapters)} 章")
    return chapters


@router.get("/{book_id}/chapters/{chapter_number}", response_model=ChapterResponse)
async def get_chapter(book_id: str, chapter_number: int, db: Session = Depends(get_db)):
    """获取指定章节内容（优先使用Supabase，备选SQLite）"""
    # 优先使用Supabase
    if supabase_client.enabled:
        try:
            chapter_data = supabase_client.get_chapter(book_id, chapter_number)
            if chapter_data:
                logger.info(f"✅ 从Supabase获取章节: {chapter_data.get('title', f'Chapter {chapter_number}')}")
                return chapter_data
        except Exception as e:
            logger.error(f"⚠️ Supabase查询失败，回退到SQLite: {e}")

    # 回退到SQLite
    chapter = db.query(Chapter).filter(
        Chapter.book_id == book_id,
        Chapter.chapter_number == chapter_number
    ).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    logger.info(f"从SQLite获取章节: {chapter.title}")
    return chapter


@router.get("/{book_id}/vocabulary", response_model=List[VocabularyResponse])
async def get_book_vocabulary(
    book_id: str,
    limit: int = Query(50, description="返回词汇数量限制"),
    db: Session = Depends(get_db)
):
    """获取书籍高频词汇（优先使用Supabase，备选SQLite）"""
    # 优先使用Supabase
    if supabase_client.enabled:
        try:
            vocab_data = supabase_client.get_book_vocabulary(book_id, limit=limit)
            logger.info(f"✅ 从Supabase获取词汇: {len(vocab_data)} 个")
            return vocab_data
        except Exception as e:
            logger.error(f"⚠️ Supabase查询失败，回退到SQLite: {e}")

    # 回退到SQLite
    vocabulary = db.query(BookVocabulary).filter(
        BookVocabulary.book_id == book_id
    ).order_by(BookVocabulary.frequency.desc()).limit(limit).all()
    logger.info(f"从SQLite获取词汇: {len(vocabulary)} 个")
    return vocabulary


@router.get("/levels/options")
async def get_level_options():
    """获取难度等级选项列表"""
    return {"levels": LEVEL_OPTIONS}


@router.post("/check-duplicate", response_model=BookDuplicateResponse)
async def check_duplicate_book(payload: BookDuplicateCheck, db: Session = Depends(get_db)):
    """
    检查上传书籍是否重复：
    - 标题、作者均使用 strip + lower 的方式标准化
    - 优先访问 Supabase，失败时自动回退 SQLite
    - 命中则返回最早创建的书籍信息（id/title/author/cover）
    """
    normalized_title = _normalize_text(payload.title)
    if not normalized_title:
        raise HTTPException(status_code=400, detail="标题不能为空")
    normalized_author = _normalize_text(payload.author)

    # 先在 Supabase 中查找重复数据（若已启用）
    if supabase_client.enabled and supabase_client.client:
        try:
            title_keyword = payload.title.strip()
            query = supabase_client.client.table("books")\
                .select("id,title,author,cover,created_at")\
                .order("created_at", desc=False)
            if title_keyword:
                query = query.ilike("title", f"%{title_keyword}%")
            result = query.execute()

            for record in result.data or []:
                if _normalize_text(record.get("title")) != normalized_title:
                    continue
                if normalized_author and _normalize_text(record.get("author")) != normalized_author:
                    continue
                logger.info(f"✅ Supabase命中重复书籍: {record.get('id')}")
                return BookDuplicateResponse(exists=True, book=_build_duplicate_info(record))
        except Exception as e:
            logger.warning(f"⚠️ Supabase重复检测失败，回退到SQLite: {e}")

    # Supabase未命中或不可用，继续使用SQLite精确比对
    try:
        title_expr = func.lower(func.trim(Book.title))
        query = db.query(Book).filter(title_expr == normalized_title)
        if normalized_author:
            author_expr = func.lower(func.trim(Book.author))
            query = query.filter(author_expr == normalized_author)
        duplicate_book = query.order_by(Book.created_at.asc()).first()
        if duplicate_book:
            logger.info(f"✅ SQLite命中重复书籍: {duplicate_book.id}")
            return BookDuplicateResponse(exists=True, book=_build_duplicate_info(duplicate_book))
    except Exception as e:
        logger.error(f"❌ SQLite重复检测失败: {e}")
        raise HTTPException(status_code=500, detail="检查书籍重复失败，请稍后重试")

    return BookDuplicateResponse(exists=False, book=None)


@router.post("/upload")
async def upload_book(
    file: UploadFile = File(..., description="EPUB文件"),
    level: str = Form(None, description="难度等级（可选，保留以兼容）"),
    lexile: str = Form(None, description="蓝思值（如：530L、BR200L）"),
    series: str = Form(None, description="系列名（如：Magic Tree House）"),
    category: str = Form(None, description="分类（fiction或non-fiction）"),
    db: Session = Depends(get_db)
):
    """
    上传EPUB书籍（自动同步到Supabase和SQLite）

    - **file**: EPUB格式的电子书文件
    - **lexile**: 蓝思值（推荐填写）
    - **series**: 系列名（可选）
    - **category**: 分类 - fiction或non-fiction（可选）
    - **level**: 难度等级（可选，保留以兼容旧版本）
    """
    # 验证文件类型
    if not file.filename.lower().endswith('.epub'):
        raise HTTPException(status_code=400, detail="只支持EPUB格式的文件")

    # 验证难度等级（如果提供）
    if level and level not in LEVEL_OPTIONS:
        raise HTTPException(status_code=400, detail=f"无效的难度等级，可选值：{', '.join(LEVEL_OPTIONS)}")

    # 验证分类（如果提供）
    if category and category not in ['fiction', 'non-fiction']:
        raise HTTPException(status_code=400, detail="分类必须是 'fiction' 或 'non-fiction'")

    # 保存上传的文件到临时目录
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)

    try:
        # 写入临时文件
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # 导入书籍（import_book.py会自动同步到Supabase）
        from scripts.import_book import import_epub
        book_id = import_epub(
            temp_path,
            level=level or "未分级",  # 提供默认值
            lexile=lexile,
            series=series,
            category=category
        )

        # 优先从Supabase获取书籍信息
        book_info = None
        if supabase_client.enabled:
            try:
                book_data = supabase_client.get_book(book_id)
                if book_data:
                    # 获取章节数量
                    chapters = supabase_client.get_chapters(book_id)
                    book_info = {
                        "id": book_data['id'],
                        "title": book_data['title'],
                        "author": book_data.get('author'),
                        "level": book_data.get('level'),
                        "lexile": book_data.get('lexile'),
                        "series": book_data.get('series'),
                        "category": book_data.get('category'),
                        "word_count": book_data.get('word_count'),
                        "chapter_count": len(chapters)
                    }
                    logger.info(f"✅ 从Supabase获取上传书籍信息: {book_data['title']}")
            except Exception as e:
                logger.warning(f"⚠️ Supabase获取书籍信息失败，使用SQLite: {e}")

        # 如果Supabase失败，从SQLite获取
        if not book_info:
            book = db.query(Book).filter(Book.id == book_id).first()
            book_info = {
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "level": book.level,
                "lexile": book.lexile,
                "series": book.series,
                "category": book.category,
                "word_count": book.word_count,
                "chapter_count": len(book.chapters)
            }
            logger.info(f"从SQLite获取上传书籍信息: {book.title}")

        return {
            "success": True,
            "message": "书籍上传成功",
            "book": book_info
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入书籍失败：{str(e)}")

    finally:
        # 清理临时文件
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


@router.delete("/{book_id}")
async def delete_book(book_id: str, db: Session = Depends(get_db)):
    """删除书籍（同时从Supabase和SQLite删除）"""
    # 先从SQLite检查书籍是否存在
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")

    try:
        # 删除Supabase中的数据
        if supabase_client.enabled:
            try:
                supabase_client.delete_book(book_id)
                logger.info(f"✅ 已从Supabase删除书籍: {book_id}")
            except Exception as e:
                logger.warning(f"⚠️ Supabase删除失败（继续删除SQLite）: {e}")

        # 删除SQLite中的相关数据
        db.query(Chapter).filter(Chapter.book_id == book_id).delete()
        db.query(BookVocabulary).filter(BookVocabulary.book_id == book_id).delete()

        # 删除OSS图片
        if oss_helper.enabled:
            oss_helper.delete_images(book_id)
            logger.info(f"已删除书籍 {book_id} 的OSS图片")

        # 删除本地图片目录（兼容旧数据）
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        oss_helper.delete_local_images(book_id, backend_dir)

        # 删除书籍记录
        db.delete(book)
        db.commit()

        logger.info(f"✅ 书籍删除成功: {book_id}")
        return {"success": True, "message": "书籍删除成功"}

    except Exception as e:
        db.rollback()
        logger.error(f"删除书籍失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除书籍失败：{str(e)}")
