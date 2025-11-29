from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BookBase(BaseModel):
    title: str
    author: Optional[str] = "Unknown"
    level: Optional[str] = None
    lexile: Optional[str] = None
    series: Optional[str] = None
    category: Optional[str] = None
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


class BookDuplicateCheck(BaseModel):
    """书籍重复检测请求体"""
    title: str
    author: Optional[str] = None


class BookDuplicateInfo(BaseModel):
    """重复检测匹配到的书籍简要信息"""
    id: str
    title: str
    author: Optional[str] = None
    cover: Optional[str] = None


class BookDuplicateResponse(BaseModel):
    """书籍重复检测返回结构"""
    exists: bool
    book: Optional[BookDuplicateInfo] = None


class BackupRequest(BaseModel):
    """备份书籍请求体"""
    book_ids: List[str]


class BackupItem(BaseModel):
    """单本书籍的备份结果"""
    book_id: str
    backup_path: str
    backup_size: int


class BackupFailure(BaseModel):
    """备份失败的书籍信息"""
    book_id: str
    reason: str


class BackupResponse(BaseModel):
    """批量备份响应"""
    success: bool
    backups: List[BackupItem] = []
    failed: List[BackupFailure] = []


class AdminDeleteRequest(BaseModel):
    """管理员批量删除请求"""
    book_ids: List[str]
    backup_before_delete: bool = False


class AdminDeleteFailure(BaseModel):
    """删除失败的书籍与原因"""
    book_id: str
    reason: str


class AdminDeleteResponse(BaseModel):
    """批量删除响应"""
    success: bool
    deleted: List[str] = []
    failed: List[AdminDeleteFailure] = []
    backups: Optional[List[BackupItem]] = None
