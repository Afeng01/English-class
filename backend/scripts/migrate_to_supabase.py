"""
SQLite 到 Supabase 数据迁移脚本
用法: python migrate_to_supabase.py [--dry-run]
"""
import argparse
import sys
import os
import logging
from typing import Dict, List, Any

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.database import SessionLocal, Book, Chapter, BookVocabulary
from app.utils.supabase_client import supabase_client

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MigrationStats:
    """迁移统计信息"""
    def __init__(self):
        self.books_total = 0
        self.books_migrated = 0
        self.books_failed = 0

        self.chapters_total = 0
        self.chapters_migrated = 0
        self.chapters_failed = 0

        self.vocabulary_total = 0
        self.vocabulary_migrated = 0
        self.vocabulary_failed = 0

    def print_summary(self):
        """打印迁移摘要"""
        logger.info("=" * 60)
        logger.info("📊 迁移统计摘要")
        logger.info("=" * 60)
        logger.info(f"📚 书籍: {self.books_migrated}/{self.books_total} 成功, {self.books_failed} 失败")
        logger.info(f"📖 章节: {self.chapters_migrated}/{self.chapters_total} 成功, {self.chapters_failed} 失败")
        logger.info(f"📝 词汇: {self.vocabulary_migrated}/{self.vocabulary_total} 成功, {self.vocabulary_failed} 失败")
        logger.info("=" * 60)


def migrate_books(db_session, stats: MigrationStats, dry_run: bool = False) -> Dict[str, bool]:
    """
    迁移书籍数据
    返回: {book_id: success} 映射，用于后续迁移章节和词汇
    """
    logger.info("📚 开始迁移书籍数据...")

    books = db_session.query(Book).all()
    stats.books_total = len(books)

    logger.info(f"找到 {stats.books_total} 本书")

    book_success_map = {}

    for book in books:
        try:
            book_data = {
                'id': book.id,
                'title': book.title,
                'author': book.author,
                'cover': book.cover,
                'level': book.level,
                'word_count': book.word_count,
                'description': book.description,
                'epub_path': book.epub_path,
                'created_at': book.created_at.isoformat() if book.created_at else None,
            }

            if dry_run:
                logger.info(f"  [DRY RUN] 将迁移书籍: {book.title}")
                stats.books_migrated += 1
                book_success_map[book.id] = True
            else:
                success = supabase_client.insert_book(book_data)
                if success:
                    logger.info(f"  ✅ 迁移成功: {book.title}")
                    stats.books_migrated += 1
                    book_success_map[book.id] = True
                else:
                    logger.error(f"  ❌ 迁移失败: {book.title}")
                    stats.books_failed += 1
                    book_success_map[book.id] = False

        except Exception as e:
            logger.error(f"  ❌ 迁移书籍出错 {book.title}: {e}")
            stats.books_failed += 1
            book_success_map[book.id] = False

    return book_success_map


def migrate_chapters(db_session, book_success_map: Dict[str, bool], stats: MigrationStats, dry_run: bool = False):
    """迁移章节数据"""
    logger.info("📖 开始迁移章节数据...")

    # 只迁移成功书籍的章节
    successful_book_ids = [book_id for book_id, success in book_success_map.items() if success]

    if not successful_book_ids:
        logger.warning("没有成功迁移的书籍，跳过章节迁移")
        return

    chapters = db_session.query(Chapter).filter(Chapter.book_id.in_(successful_book_ids)).all()
    stats.chapters_total = len(chapters)

    logger.info(f"找到 {stats.chapters_total} 个章节")

    # 批量迁移，每批100个
    batch_size = 100
    for i in range(0, len(chapters), batch_size):
        batch = chapters[i:i + batch_size]

        chapters_data = []
        for chapter in batch:
            chapter_data = {
                'id': chapter.id,
                'book_id': chapter.book_id,
                'chapter_number': chapter.chapter_number,
                'title': chapter.title,
                'content': chapter.content,
                'word_count': chapter.word_count,
            }
            chapters_data.append(chapter_data)

        if dry_run:
            logger.info(f"  [DRY RUN] 将迁移章节批次: {i+1}-{min(i+batch_size, len(chapters))}/{len(chapters)}")
            stats.chapters_migrated += len(batch)
        else:
            try:
                success = supabase_client.bulk_insert_chapters(chapters_data)
                if success:
                    logger.info(f"  ✅ 批次迁移成功: {i+1}-{min(i+batch_size, len(chapters))}/{len(chapters)}")
                    stats.chapters_migrated += len(batch)
                else:
                    logger.error(f"  ❌ 批次迁移失败: {i+1}-{min(i+batch_size, len(chapters))}")
                    stats.chapters_failed += len(batch)
            except Exception as e:
                logger.error(f"  ❌ 章节批次迁移出错: {e}")
                stats.chapters_failed += len(batch)


def migrate_vocabulary(db_session, book_success_map: Dict[str, bool], stats: MigrationStats, dry_run: bool = False):
    """迁移词汇数据"""
    logger.info("📝 开始迁移词汇数据...")

    # 只迁移成功书籍的词汇
    successful_book_ids = [book_id for book_id, success in book_success_map.items() if success]

    if not successful_book_ids:
        logger.warning("没有成功迁移的书籍，跳过词汇迁移")
        return

    vocabulary = db_session.query(BookVocabulary).filter(BookVocabulary.book_id.in_(successful_book_ids)).all()
    stats.vocabulary_total = len(vocabulary)

    logger.info(f"找到 {stats.vocabulary_total} 个词汇")

    # 批量迁移，每批200个
    batch_size = 200
    for i in range(0, len(vocabulary), batch_size):
        batch = vocabulary[i:i + batch_size]

        vocab_data = []
        for vocab in batch:
            vocab_item = {
                'id': vocab.id,
                'book_id': vocab.book_id,
                'word': vocab.word,
                'frequency': vocab.frequency,
                'phonetic': vocab.phonetic,
                'definition': vocab.definition,
            }
            vocab_data.append(vocab_item)

        if dry_run:
            logger.info(f"  [DRY RUN] 将迁移词汇批次: {i+1}-{min(i+batch_size, len(vocabulary))}/{len(vocabulary)}")
            stats.vocabulary_migrated += len(batch)
        else:
            try:
                success = supabase_client.bulk_insert_vocabulary(vocab_data)
                if success:
                    logger.info(f"  ✅ 批次迁移成功: {i+1}-{min(i+batch_size, len(vocabulary))}/{len(vocabulary)}")
                    stats.vocabulary_migrated += len(batch)
                else:
                    logger.error(f"  ❌ 批次迁移失败: {i+1}-{min(i+batch_size, len(vocabulary))}")
                    stats.vocabulary_failed += len(batch)
            except Exception as e:
                logger.error(f"  ❌ 词汇批次迁移出错: {e}")
                stats.vocabulary_failed += len(batch)


def verify_migration(db_session, stats: MigrationStats) -> bool:
    """验证迁移完整性"""
    logger.info("🔍 开始验证迁移...")

    try:
        # 验证书籍数量
        books_in_supabase = supabase_client.list_books()
        if books_in_supabase:
            logger.info(f"  ✅ Supabase中有 {len(books_in_supabase)} 本书")
            if len(books_in_supabase) == stats.books_migrated:
                logger.info(f"  ✅ 书籍数量匹配")
            else:
                logger.warning(f"  ⚠️  书籍数量不匹配: Supabase {len(books_in_supabase)} vs 迁移 {stats.books_migrated}")
        else:
            logger.error("  ❌ 无法获取Supabase书籍列表")
            return False

        # 抽样验证：检查第一本书的章节和词汇
        if books_in_supabase:
            first_book = books_in_supabase[0]
            book_id = first_book.get('id')

            chapters = supabase_client.get_chapters(book_id)
            vocabulary = supabase_client.get_book_vocabulary(book_id)

            logger.info(f"  📊 抽样验证书籍 {first_book.get('title')}:")
            logger.info(f"    - 章节数: {len(chapters) if chapters else 0}")
            logger.info(f"    - 词汇数: {len(vocabulary) if vocabulary else 0}")

        logger.info("✅ 验证完成")
        return True

    except Exception as e:
        logger.error(f"❌ 验证失败: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Migrate SQLite data to Supabase')
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='模拟运行，不实际迁移数据'
    )
    parser.add_argument(
        '--skip-verification',
        action='store_true',
        help='跳过迁移后的验证步骤'
    )

    args = parser.parse_args()

    # 检查Supabase是否已配置
    if not supabase_client.enabled:
        logger.error("❌ Supabase未配置或配置无效")
        logger.error("请检查.env文件中的SUPABASE_URL和SUPABASE_SERVICE_KEY")
        sys.exit(1)

    if args.dry_run:
        logger.info("🔄 运行模式: DRY RUN (模拟运行)")
    else:
        logger.info("🔄 运行模式: 实际迁移")
        logger.warning("⚠️  此操作将向Supabase写入数据，请确认已做好备份！")

        # 等待用户确认
        response = input("是否继续? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            logger.info("❌ 用户取消迁移")
            sys.exit(0)

    logger.info("=" * 60)
    logger.info("🚀 开始数据迁移")
    logger.info("=" * 60)

    # 创建数据库会话
    db = SessionLocal()
    stats = MigrationStats()

    try:
        # 1. 迁移书籍
        book_success_map = migrate_books(db, stats, dry_run=args.dry_run)

        # 2. 迁移章节
        migrate_chapters(db, book_success_map, stats, dry_run=args.dry_run)

        # 3. 迁移词汇
        migrate_vocabulary(db, book_success_map, stats, dry_run=args.dry_run)

        # 4. 打印统计
        stats.print_summary()

        # 5. 验证迁移（非dry-run模式）
        if not args.dry_run and not args.skip_verification:
            verify_migration(db, stats)

        if args.dry_run:
            logger.info("✅ 模拟运行完成，未实际迁移数据")
        else:
            logger.info("✅ 迁移完成！")
            logger.info("💡 提示: 现在可以使用Supabase作为数据源")

    except Exception as e:
        logger.error(f"❌ 迁移过程中出现错误: {e}")
        sys.exit(1)

    finally:
        db.close()


if __name__ == '__main__':
    main()
