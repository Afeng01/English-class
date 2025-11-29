"""
书籍去重脚本
使用示例：
    python deduplicate_books.py --dry-run   # 仅查看将被删除的书籍
    python deduplicate_books.py             # 实际删除重复书籍
"""
import argparse
import logging
import os
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple

# 将 backend 目录加入模块搜索路径，便于导入 app 包
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session  # noqa: E402

from app.models.database import Book, BookVocabulary, Chapter, SessionLocal  # noqa: E402
from app.utils.oss_helper import oss_helper  # noqa: E402
from app.utils.supabase_client import supabase_client  # noqa: E402

# 时区：中国标准时间
CN_TZ = timezone(timedelta(hours=8))

# 目录路径
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
CLAUDE_DIR = os.path.join(PROJECT_ROOT, ".claude")

# 日志配置
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def normalize_title(title: str) -> str:
    """归一化标题，用于判定重复。"""
    if not title:
        return ""
    return title.strip().lower()


def has_cover(book: Book) -> bool:
    """判断书籍是否有封面。"""
    return bool((book.cover or "").strip())


def format_dt(value: datetime) -> str:
    """格式化时间为中国时区字符串。"""
    if not value:
        return "-"
    dt = value
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(CN_TZ).strftime("%Y-%m-%d %H:%M:%S")


def pick_book_to_keep(books: List[Book]) -> Book:
    """按照封面优先、创建时间最早的规则选择保留书籍。"""
    candidates = [book for book in books if has_cover(book)]
    if not candidates:
        candidates = books

    def sort_key(book: Book):
        created = book.created_at or datetime.max.replace(tzinfo=None)
        return created, book.id

    return sorted(candidates, key=sort_key)[0]


def delete_book(session: Session, book: Book) -> Tuple[bool, List[str]]:
    """
    删除单本书籍，同时清理Supabase、SQLite和图片。
    返回 (是否全部成功, 操作日志列表)。
    """
    book_id = book.id
    step_logs: List[str] = []
    errors: List[str] = []

    if supabase_client.enabled:
        try:
            supabase_client.delete_book(book_id)
            step_logs.append("已从Supabase删除")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"Supabase删除失败: {exc}")
            step_logs.append(f"Supabase删除失败: {exc}")
    else:
        step_logs.append("Supabase未启用，跳过云端记录删除")

    try:
        if oss_helper.enabled:
            oss_helper.delete_images(book_id)
            step_logs.append("已删除远程图片")
        else:
            step_logs.append("OSS未启用，跳过远程图片删除")
    except Exception as exc:  # noqa: BLE001
        errors.append(f"远程图片删除失败: {exc}")
        step_logs.append(f"远程图片删除失败: {exc}")

    try:
        oss_helper.delete_local_images(book_id, BACKEND_DIR)
        step_logs.append("已清理本地图片目录")
    except Exception as exc:  # noqa: BLE001
        errors.append(f"本地图片删除失败: {exc}")
        step_logs.append(f"本地图片删除失败: {exc}")

    try:
        session.query(Chapter).filter(Chapter.book_id == book_id).delete(synchronize_session=False)
        session.query(BookVocabulary).filter(BookVocabulary.book_id == book_id).delete(synchronize_session=False)
        session.delete(book)
        session.commit()
        step_logs.append("SQLite记录删除完成")
    except Exception as exc:  # noqa: BLE001
        session.rollback()
        errors.append(f"SQLite删除失败: {exc}")
        step_logs.append(f"SQLite删除失败: {exc}")

    success = len(errors) == 0
    return success, step_logs


def collect_duplicates(books: List[Book]) -> Dict[str, List[Book]]:
    """按照归一化标题分组，返回重复项字典。"""
    grouped: Dict[str, List[Book]] = defaultdict(list)
    for book in books:
        key = normalize_title(book.title)
        grouped[key].append(book)
    return {key: items for key, items in grouped.items() if len(items) > 1}


def write_report(
    entries: List[Dict],
    stats: Dict[str, int],
    dry_run: bool,
    log_path: str,
) -> None:
    """将去重结果写入Markdown日志。"""
    os.makedirs(CLAUDE_DIR, exist_ok=True)
    now = datetime.now(CN_TZ)
    lines: List[str] = [
        "# 书籍去重日志",
        f"- 记录时间: {now.strftime('%Y-%m-%d %H:%M')} (UTC+8, Codex)",
        f"- 执行模式: {'Dry Run（未实际删除）' if dry_run else '实际删除'}",
        f"- 重复分组总数: {stats['duplicate_groups']}",
        f"- 待删除书籍数量: {stats['books_to_delete']}",
        f"- 实际删除成功: {stats['deleted_success']}",
        f"- 删除失败: {stats['deleted_failed']}",
        "",
    ]

    if not entries:
        lines.append("本次扫描未发现重复书籍。")
    else:
        for entry in entries:
            lines.append(f"## 第 {entry['index']} 组 · 《{entry['display_title']}》")
            lines.append(f"- 归一化标题: `{entry['normalized_title'] or '(空)'}`")
            lines.append(f"- 组内书籍数量: {entry['count']}")
            lines.append(f"- 保留书籍ID: `{entry['kept_book_id']}`")
            lines.append("")
            lines.append("| 书籍ID | 标题 | 封面 | 创建时间 (UTC+8) | 操作 | 结果 |")
            lines.append("| --- | --- | --- | --- | --- | --- |")
            for book in entry["books"]:
                lines.append(
                    f"| `{book['id']}` | {book['title'] or '-'} | {book['cover_status']} | "
                    f"{book['created_at']} | {book['action']} | {book['result']} |"
                )
            lines.append("")

    with open(log_path, "w", encoding="utf-8") as file:
        file.write("\n".join(lines))


def deduplicate_books(dry_run: bool) -> Tuple[bool, str]:
    """执行去重逻辑，返回 (是否完全成功, 日志路径)。"""
    session: Session = SessionLocal()
    timestamp = datetime.now(CN_TZ).strftime("%Y%m%d-%H%M%S")
    log_path = os.path.join(CLAUDE_DIR, f"deduplication-log-{timestamp}.md")

    try:
        books = session.query(Book).all()
        logger.info("📘 共查询到 %s 本书籍", len(books))

        duplicates = collect_duplicates(books)
        logger.info("🔍 发现 %s 组可能的重复书籍", len(duplicates))

        if not duplicates:
            write_report([], {
                "duplicate_groups": 0,
                "books_to_delete": 0,
                "deleted_success": 0,
                "deleted_failed": 0,
            }, dry_run, log_path)
            logger.info("✅ 去重完成，未发现重复书籍。日志: %s", log_path)
            return True, log_path

        entries = []
        stats = {
            "duplicate_groups": len(duplicates),
            "books_to_delete": 0,
            "deleted_success": 0,
            "deleted_failed": 0,
        }
        any_failure = False

        for index, key in enumerate(sorted(duplicates.keys()), start=1):
            group = duplicates[key]
            keep = pick_book_to_keep(group)
            to_delete = [book for book in group if book.id != keep.id]
            stats["books_to_delete"] += len(to_delete)

            logger.info(
                "➡️  第 %s 组《%s》：共 %s 本，保留 %s，计划删除 %s 本",
                index,
                keep.title or key or "未命名",
                len(group),
                keep.id,
                len(to_delete),
            )

            book_rows = []
            ordered_group = sorted(group, key=lambda item: (item.id != keep.id, item.created_at or datetime.max))
            for book in ordered_group:
                action = "保留" if book.id == keep.id else ("删除" if not dry_run else "计划删除")
                result_text = (
                    "保留"
                    if book.id == keep.id
                    else "Dry Run - 未删除"
                    if dry_run
                    else "待删除"
                )
                book_rows.append({
                    "id": book.id,
                    "title": book.title,
                    "cover_status": "有封面" if has_cover(book) else "无封面",
                    "created_at": format_dt(book.created_at) if book.created_at else "-",
                    "action": action,
                    "result": result_text,
                })

            if not dry_run:
                for book in to_delete:
                    success, steps = delete_book(session, book)
                    result_message = "删除成功" if success else f"删除失败：{'；'.join(steps)}"
                    if success:
                        stats["deleted_success"] += 1
                    else:
                        stats["deleted_failed"] += 1
                        any_failure = True
                    logger.info("    • 书籍 %s → %s", book.id, result_message)
                    for row in book_rows:
                        if row["id"] == book.id:
                            row["result"] = "；".join(steps) if steps else result_message
                            row["action"] = "删除"
                            if not success:
                                row["result"] = result_message
                            break
            else:
                logger.info("    • Dry Run 模式，仅记录待删除书籍")

            entries.append({
                "index": index,
                "normalized_title": key,
                "display_title": keep.title or key or "未命名",
                "kept_book_id": keep.id,
                "count": len(group),
                "books": book_rows,
            })

        write_report(entries, stats, dry_run, log_path)
        logger.info("📝 详细日志已写入 %s", log_path)
        if dry_run:
            logger.info("💡 Dry Run 模式完成，请在确认后移除 --dry-run 参数执行实际删除。")
            return True, log_path

        if stats["deleted_failed"] > 0:
            logger.warning("⚠️ 有 %s 本书籍删除失败，详情见日志。", stats["deleted_failed"])
        else:
            logger.info("✅ 所有重复书籍删除成功。")

        return not any_failure, log_path
    finally:
        session.close()


def main():
    """命令行入口。"""
    parser = argparse.ArgumentParser(description="按标题去重书籍记录")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="仅打印将被删除的书籍，不执行删除操作",
    )
    args = parser.parse_args()

    try:
        success, log_path = deduplicate_books(args.dry_run)
        if args.dry_run:
            logger.info("Dry Run 完成，日志: %s", log_path)
        sys.exit(0 if success else 1)
    except Exception as exc:  # noqa: BLE001
        logger.exception("❌ 去重过程中出现未捕获异常: %s", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()
