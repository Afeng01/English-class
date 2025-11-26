from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import tempfile
import shutil
import logging

from app.models.database import get_db, Book, Chapter, BookVocabulary
from app.schemas.schemas import BookResponse, BookDetailResponse, ChapterResponse, VocabularyResponse
from app.utils.oss_helper import oss_helper

logger = logging.getLogger(__name__)

router = APIRouter()

# 难度等级选项
LEVEL_OPTIONS = [
    "学前", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
    "初一", "初二", "初三", "高一", "高二", "高三"
]


@router.get("", response_model=List[BookResponse])
async def get_books(
    level: Optional[str] = Query(None, description="按难度等级筛选"),
    search: Optional[str] = Query(None, description="搜索书名"),
    db: Session = Depends(get_db)
):
    """获取书籍列表"""
    query = db.query(Book)

    if level:
        query = query.filter(Book.level == level)
    if search:
        query = query.filter(Book.title.ilike(f"%{search}%"))

    books = query.order_by(Book.created_at.desc()).all()
    return books


@router.get("/{book_id}", response_model=BookDetailResponse)
async def get_book(book_id: str, db: Session = Depends(get_db)):
    """获取书籍详情"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.get("/{book_id}/chapters", response_model=List[ChapterResponse])
async def get_book_chapters(book_id: str, db: Session = Depends(get_db)):
    """获取书籍章节列表"""
    chapters = db.query(Chapter).filter(
        Chapter.book_id == book_id
    ).order_by(Chapter.chapter_number).all()
    return chapters


@router.get("/{book_id}/chapters/{chapter_number}", response_model=ChapterResponse)
async def get_chapter(book_id: str, chapter_number: int, db: Session = Depends(get_db)):
    """获取指定章节内容"""
    chapter = db.query(Chapter).filter(
        Chapter.book_id == book_id,
        Chapter.chapter_number == chapter_number
    ).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter


@router.get("/{book_id}/vocabulary", response_model=List[VocabularyResponse])
async def get_book_vocabulary(
    book_id: str,
    limit: int = Query(50, description="返回词汇数量限制"),
    db: Session = Depends(get_db)
):
    """获取书籍高频词汇"""
    vocabulary = db.query(BookVocabulary).filter(
        BookVocabulary.book_id == book_id
    ).order_by(BookVocabulary.frequency.desc()).limit(limit).all()
    return vocabulary


@router.get("/levels/options")
async def get_level_options():
    """获取难度等级选项列表"""
    return {"levels": LEVEL_OPTIONS}


@router.post("/upload")
async def upload_book(
    file: UploadFile = File(..., description="EPUB文件"),
    level: str = Form(..., description="难度等级"),
    db: Session = Depends(get_db)
):
    """
    上传EPUB书籍

    - **file**: EPUB格式的电子书文件
    - **level**: 难度等级（如：学前、一年级、初一等）
    """
    # 验证文件类型
    if not file.filename.lower().endswith('.epub'):
        raise HTTPException(status_code=400, detail="只支持EPUB格式的文件")

    # 验证难度等级
    if level not in LEVEL_OPTIONS:
        raise HTTPException(status_code=400, detail=f"无效的难度等级，可选值：{', '.join(LEVEL_OPTIONS)}")

    # 保存上传的文件到临时目录
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)

    try:
        # 写入临时文件
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # 导入书籍
        from scripts.import_book import import_epub
        book_id = import_epub(temp_path, level)

        # 获取导入的书籍信息
        book = db.query(Book).filter(Book.id == book_id).first()

        return {
            "success": True,
            "message": "书籍上传成功",
            "book": {
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "level": book.level,
                "word_count": book.word_count,
                "chapter_count": len(book.chapters)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入书籍失败：{str(e)}")

    finally:
        # 清理临时文件
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


@router.delete("/{book_id}")
async def delete_book(book_id: str, db: Session = Depends(get_db)):
    """删除书籍"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")

    try:
        # 删除相关的章节
        db.query(Chapter).filter(Chapter.book_id == book_id).delete()

        # 删除相关的词汇
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

        return {"success": True, "message": "书籍删除成功"}

    except Exception as e:
        db.rollback()
        logger.error(f"删除书籍失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除书籍失败：{str(e)}")
