from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BookBase(BaseModel):
    title: str
    author: Optional[str] = "Unknown"
    level: Optional[str] = None
    description: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookResponse(BookBase):
    id: str
    cover: Optional[str] = None
    word_count: int = 0
    epub_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChapterResponse(BaseModel):
    id: str
    chapter_number: int
    title: Optional[str] = None
    content: Optional[str] = None
    word_count: int = 0

    class Config:
        from_attributes = True


class VocabularyResponse(BaseModel):
    id: str
    word: str
    frequency: int
    phonetic: Optional[str] = None
    definition: Optional[str] = None

    class Config:
        from_attributes = True


class BookDetailResponse(BookResponse):
    chapters: List[ChapterResponse] = []


class DictionaryResponse(BaseModel):
    word: str
    phonetic: Optional[str] = None
    meanings: List[dict] = []
    audio: Optional[str] = None
    searched_word: Optional[str] = None  # 用户查询的原词（词形变化）
    lemma: Optional[str] = None  # 还原后的词根
