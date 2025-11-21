from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.database import get_db, Book, Chapter, BookVocabulary
from app.schemas.schemas import BookResponse, BookDetailResponse, ChapterResponse, VocabularyResponse

router = APIRouter()


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
