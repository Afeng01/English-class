"""
章节图片URL修复脚本
将章节内容中的 /static/images/ 前缀批量替换为 OSS 地址
"""
import argparse
import logging
import re
import sys
from pathlib import Path

# 将 backend 目录加入模块搜索路径，便于脚本直接复用应用内模块
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.models.database import SessionLocal, Chapter  # noqa: E402
from app.utils.supabase_client import supabase_client  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

LOCAL_PREFIX_PATTERN = re.compile(r"/static/images/")
OSS_PREFIX = "https://english-acquire.oss-cn-hongkong.aliyuncs.com/"


class FixStats:
    """用于收集脚本执行统计数据"""

    def __init__(self):
        self.total_chapters = 0
        self.chapters_updated = 0
        self.chapters_skipped = 0
        self.failed_chapters = 0
        self.total_replacements = 0
        self.supabase_synced = 0
        self.supabase_failed = 0


def sync_supabase(chapter_id: str, content: str, stats: FixStats) -> None:
    """同步单个章节到 Supabase"""
    if not supabase_client.enabled or not supabase_client.client:
        return

    try:
        supabase_client.client.table("chapters") \
            .update({"content": content}) \
            .eq("id", chapter_id) \
            .execute()
        stats.supabase_synced += 1
        logger.info("✅ Supabase 已同步章节 %s", chapter_id)
    except Exception as exc:
        stats.supabase_failed += 1
        logger.warning("⚠️ Supabase 同步章节 %s 失败: %s", chapter_id, exc)


def fix_chapter_image_urls(dry_run: bool = False) -> FixStats:
    """扫描并修复章节内容中的本地图片路径"""
    stats = FixStats()
    session = SessionLocal()

    try:
        chapters = session.query(Chapter).filter(Chapter.content.contains("/static/images/")).all()
        stats.total_chapters = len(chapters)

        if not chapters:
            logger.info("✅ 未找到包含本地图片路径的章节，脚本无需执行")
            return stats

        logger.info("📘 找到 %s 个章节仍引用本地图片，准备修复", stats.total_chapters)

        for chapter in chapters:
            content = chapter.content or ""
            updated_content, replacements = LOCAL_PREFIX_PATTERN.subn(OSS_PREFIX, content)

            if replacements == 0:
                stats.chapters_skipped += 1
                continue

            chapter_name = chapter.title or f"第 {chapter.chapter_number} 章"
            book_title = chapter.book.title if chapter.book else "未知书籍"

            logger.info("-" * 60)
            logger.info("📄 章节: %s (%s)", chapter_name, chapter.id)
            logger.info("📚 所属书籍: %s (%s)", book_title, chapter.book_id)
            logger.info("🔁 计划替换 %s 处图片路径", replacements)

            stats.total_replacements += replacements

            if dry_run:
                logger.info("📝 Dry Run 模式: 仅预览替换效果，不写入数据库")
                continue

            try:
                chapter.content = updated_content
                session.add(chapter)
                session.commit()
                stats.chapters_updated += 1
                logger.info("✅ 章节内容已写回数据库")
                sync_supabase(chapter.id, updated_content, stats)
            except Exception as exc:
                session.rollback()
                stats.failed_chapters += 1
                logger.error("❌ 更新章节 %s 失败: %s", chapter.id, exc)

        return stats
    finally:
        session.close()


def log_summary(stats: FixStats, dry_run: bool) -> None:
    """输出脚本执行统计"""
    logger.info("\n" + "=" * 60)
    logger.info("📊 章节图片路径修复统计")
    logger.info("=" * 60)
    logger.info("章节总数: %s", stats.total_chapters)
    logger.info("章节已更新: %s", stats.chapters_updated)
    logger.info("章节跳过: %s", stats.chapters_skipped)
    logger.info("章节失败: %s", stats.failed_chapters)
    logger.info("路径替换总次数: %s", stats.total_replacements)

    if dry_run:
        logger.info("当前为 Dry Run 模式，未对数据库做任何修改")

    if supabase_client.enabled:
        logger.info("Supabase 同步成功: %s", stats.supabase_synced)
        logger.info("Supabase 同步失败: %s", stats.supabase_failed)
    else:
        logger.info("Supabase 未启用，跳过远端同步")

    logger.info("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="修复章节内容中的图片路径为 OSS 地址")
    parser.add_argument("--dry-run", action="store_true", help="预览替换效果，不写入数据库")
    args = parser.parse_args()

    stats = fix_chapter_image_urls(dry_run=args.dry_run)
    log_summary(stats, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
