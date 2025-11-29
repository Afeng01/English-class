import json
import logging
import os
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.api.books import delete_book
from app.middleware.admin_check import require_admin_mode
from app.models.database import Book, get_db
from app.schemas.schemas import (
    AdminDeleteFailure,
    AdminDeleteRequest,
    AdminDeleteResponse,
    BackupFailure,
    BackupItem,
    BackupRequest,
    BackupResponse,
    BookResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin_mode)]
)

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_BACKUP_DIR = os.path.join(_BACKEND_ROOT, "data", "backups")


def _sanitize_book_id(book_id: str) -> str:
    """将书籍ID转换为安全的文件名片段"""
    return book_id.replace("/", "_").replace("\\", "_")


def _ensure_backup_dir() -> None:
    """确保备份目录存在"""
    os.makedirs(_BACKUP_DIR, exist_ok=True)


def _relative_backup_path(absolute_path: str) -> str:
    """生成相对于仓库 backend 目录的路径，保持日志与响应一致"""
    relative = os.path.relpath(absolute_path, _BACKEND_ROOT)
    normalized = relative.replace(os.sep, "/")
    return f"backend/{normalized}" if not normalized.startswith("backend/") else normalized


def _load_book_with_relations(book_id: str, db: Session) -> Optional[Book]:
    """加载书籍及其关联记录，供备份/删除使用"""
    return (
        db.query(Book)
        .options(
            selectinload(Book.chapters),
            selectinload(Book.vocabulary)
        )
        .filter(Book.id == book_id)
        .first()
    )


def _serialize_book_bundle(book: Book) -> dict:
    """将书籍、章节、词汇序列化为JSON友好格式"""
    return {
        "book": {
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "cover": book.cover,
            "level": book.level,
            "lexile": book.lexile,
            "series": book.series,
            "category": book.category,
            "word_count": book.word_count,
            "description": book.description,
            "epub_path": book.epub_path,
            "created_at": book.created_at.isoformat() if book.created_at else None,
        },
        "chapters": [
            {
                "id": chapter.id,
                "book_id": chapter.book_id,
                "chapter_number": chapter.chapter_number,
                "title": chapter.title,
                "content": chapter.content,
                "word_count": chapter.word_count,
            }
            for chapter in sorted(book.chapters, key=lambda c: c.chapter_number)
        ],
        "vocabulary": [
            {
                "id": vocab.id,
                "book_id": vocab.book_id,
                "word": vocab.word,
                "frequency": vocab.frequency,
                "phonetic": vocab.phonetic,
                "definition": vocab.definition,
            }
            for vocab in sorted(book.vocabulary, key=lambda v: v.frequency, reverse=True)
        ],
    }


def _backup_single_book(book_id: str, db: Session) -> Tuple[Optional[BackupItem], Optional[BackupFailure]]:
    """备份单本书籍，返回成功或失败结果"""
    book = _load_book_with_relations(book_id, db)
    if not book:
        return None, BackupFailure(book_id=book_id, reason="书籍不存在")

    try:
        _ensure_backup_dir()
        timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        safe_id = _sanitize_book_id(book_id)
        file_name = f"book_{safe_id}_{timestamp}.json"
        absolute_path = os.path.join(_BACKUP_DIR, file_name)
        payload = _serialize_book_bundle(book)
        with open(absolute_path, "w", encoding="utf-8") as fp:
            json.dump(payload, fp, ensure_ascii=False, indent=2)

        backup_size = os.path.getsize(absolute_path)
        backup_item = BackupItem(
            book_id=book_id,
            backup_path=_relative_backup_path(absolute_path),
            backup_size=backup_size
        )
        logger.info("✅ 书籍备份完成 book_id=%s path=%s size=%sB", book_id, backup_item.backup_path, backup_size)
        return backup_item, None
    except Exception as exc:
        logger.exception("❌ 书籍备份失败 book_id=%s error=%s", book_id, exc)
        return None, BackupFailure(book_id=book_id, reason=str(exc))


@router.get("/books", response_model=List[BookResponse])
async def admin_get_books(db: Session = Depends(get_db)):
    """管理员：获取所有书籍列表"""
    books = db.query(Book).order_by(Book.created_at.desc()).all()
    logger.info("🔎 管理员获取书籍列表 total=%s", len(books))
    return books


@router.post("/backup", response_model=BackupResponse)
async def admin_backup_books(payload: BackupRequest, db: Session = Depends(get_db)):
    """管理员：批量备份书籍"""
    if not payload.book_ids:
        raise HTTPException(status_code=400, detail="请至少提供一本书籍ID")

    backups: List[BackupItem] = []
    failed: List[BackupFailure] = []

    for book_id in payload.book_ids:
        backup_item, failure = _backup_single_book(book_id, db)
        if backup_item:
            backups.append(backup_item)
        elif failure:
            failed.append(failure)

    success = len(failed) == 0
    logger.info("📦 书籍备份完成 success=%s backups=%s failed=%s", success, len(backups), len(failed))
    return BackupResponse(success=success, backups=backups, failed=failed)


@router.delete("/books", response_model=AdminDeleteResponse)
async def admin_delete_books(payload: AdminDeleteRequest, db: Session = Depends(get_db)):
    """管理员：批量删除书籍，必要时先自动备份"""
    if not payload.book_ids:
        raise HTTPException(status_code=400, detail="请至少提供一本书籍ID")

    deleted: List[str] = []
    failed: List[AdminDeleteFailure] = []
    backups: List[BackupItem] = []

    for book_id in payload.book_ids:
        logger.info("🗑️ 正在删除书籍 book_id=%s", book_id)

        if payload.backup_before_delete:
            backup_item, failure = _backup_single_book(book_id, db)
            if failure:
                failed.append(AdminDeleteFailure(book_id=book_id, reason=f"备份失败：{failure.reason}"))
                logger.warning("⚠️ 备份失败，跳过删除 book_id=%s", book_id)
                continue
            if backup_item:
                backups.append(backup_item)

        try:
            await delete_book(book_id, db)
            deleted.append(book_id)
            logger.info("✅ 书籍删除成功 book_id=%s", book_id)
        except HTTPException as http_exc:
            failed.append(AdminDeleteFailure(book_id=book_id, reason=str(http_exc.detail)))
            logger.warning("❌ 删除失败 book_id=%s status=%s reason=%s", book_id, http_exc.status_code, http_exc.detail)
        except Exception as exc:
            failed.append(AdminDeleteFailure(book_id=book_id, reason=str(exc)))
            logger.exception("❌ 删除失败 book_id=%s error=%s", book_id, exc)

    success = len(failed) == 0
    response = AdminDeleteResponse(
        success=success,
        deleted=deleted,
        failed=failed,
        backups=backups if payload.backup_before_delete else None
    )
    logger.info(
        "🧾 批量删除完成 success=%s deleted=%s failed=%s backups=%s",
        success,
        len(deleted),
        len(failed),
        len(backups) if payload.backup_before_delete else 0
    )
    return response
