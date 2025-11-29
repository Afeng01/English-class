"""
将本地存储的书籍封面迁移到阿里云OSS
"""
import argparse
import logging
import os
import re
import sys
from pathlib import Path

# 添加项目根目录到路径
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.models.database import SessionLocal, Book, Chapter
from app.utils.oss_helper import oss_helper
from app.utils.supabase_client import supabase_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 匹配章节内容中引用本地静态图片的 <img> 标签
IMAGE_TAG_PATTERN = re.compile(r'<img[^>]+src=["\'](/static/images/[^"\']+)["\']', re.IGNORECASE)


def migrate_book_images(db, dry_run: bool = False):
    """迁移本地图片到OSS"""
    if not oss_helper.enabled or oss_helper.backend != "ali_oss":
        logger.error("❌ 阿里云OSS未启用，无法执行迁移")
        logger.error("   请确认 .env 中 USE_OSS=true 且已正确安装 / 配置 oss2")
        return

    books = db.query(Book).filter(Book.cover.like('/static/images/%')).all()
    if not books:
        logger.info("✅ 没有需要迁移的书籍")
        return

    logger.info(f"📦 找到 {len(books)} 本封面仍在本地的书籍")
    success_count = 0
    fail_count = 0

    for book in books:
        logger.info("\n" + "-" * 40)
        logger.info(f"📖 处理书籍: {book.title} ({book.id})")
        logger.info(f"旧封面: {book.cover}")

        relative_path = book.cover.replace('/static/images/', '')
        local_path = backend_dir / 'data' / 'images' / relative_path

        if not local_path.exists():
            logger.warning(f"⚠️ 本地文件不存在: {local_path}")
            fail_count += 1
            continue

        object_name = relative_path.replace('\\', '/')
        try:
            if dry_run:
                logger.info(f"[DRY RUN] 将上传到 OSS: {object_name}")
                success_count += 1
                continue

            with open(local_path, 'rb') as f:
                image_data = f.read()

            oss_url = oss_helper.upload_image(image_data, object_name)
            logger.info(f"✅ 上传成功: {oss_url}")

            book.cover = oss_url
            db.commit()
            logger.info("✅ 数据库已更新")

            if supabase_client.enabled:
                try:
                    supabase_client.client.table('books')\
                        .update({'cover': oss_url})\
                        .eq('id', book.id)\
                        .execute()
                    logger.info("✅ Supabase已同步")
                except Exception as e:
                    logger.warning(f"⚠️ Supabase同步失败: {e}")

            success_count += 1
        except Exception as e:
            logger.error(f"❌ 迁移失败: {e}")
            db.rollback()
            fail_count += 1

    logger.info("\n" + "=" * 50)
    logger.info("📊 迁移完成")
    logger.info(f"成功: {success_count} 本")
    logger.info(f"失败: {fail_count} 本")
    logger.info("=" * 50)


def migrate_chapter_images(db, dry_run: bool = False):
    """迁移章节内容中的本地图片引用"""
    if not oss_helper.enabled or oss_helper.backend != "ali_oss":
        logger.error("❌ 阿里云OSS未启用，无法执行章节内容迁移")
        return

    chapters = db.query(Chapter).filter(Chapter.content.contains('/static/images/')).all()
    if not chapters:
        logger.info("✅ 没有章节引用本地图片，无需迁移")
        return

    logger.info(f"📘 找到 {len(chapters)} 个章节包含本地图片，准备迁移内容中的引用")
    total_images = 0
    uploaded_images = 0
    success_chapters = 0
    failed_chapters = 0
    dry_run_chapters = 0

    for chapter in chapters:
        try:
            content = chapter.content or ""
            image_paths = IMAGE_TAG_PATTERN.findall(content)
            unique_images = list(dict.fromkeys(image_paths))

            if not unique_images:
                logger.info(f"ℹ️ 章节 {chapter.id} 无法解析出图片标签，跳过")
                continue

            total_images += len(unique_images)
            chapter_name = chapter.title or f"第{chapter.chapter_number}章"
            book_title = chapter.book.title if chapter.book else "未知书籍"

            logger.info("\n" + "-" * 40)
            logger.info(f"📄 章节: {chapter_name} ({chapter.id})")
            logger.info(f"📚 所属书籍: {book_title} ({chapter.book_id})")
            logger.info(f"🖼️ 找到 {len(unique_images)} 张本地图片")

            replacements = []
            for image_path in unique_images:
                try:
                    relative_path = image_path.split('/static/images/', 1)[1]
                except IndexError:
                    logger.warning(f"⚠️ 图片路径格式异常，跳过: {image_path}")
                    continue

                local_path = backend_dir / 'data' / 'images' / relative_path
                if not local_path.exists():
                    logger.warning(f"⚠️ 本地图片不存在: {local_path}")
                    continue

                object_name = relative_path.replace('\\', '/')
                if dry_run:
                    logger.info(f"[DRY RUN] 将上传章节图片: {image_path} -> {object_name}")
                    continue

                with open(local_path, 'rb') as f:
                    image_data = f.read()

                oss_url = oss_helper.upload_image(image_data, object_name)
                logger.info(f"✅ 上传章节图片成功: {oss_url}")
                replacements.append((image_path, oss_url))

            if dry_run:
                dry_run_chapters += 1
                continue

            if not replacements:
                logger.info("ℹ️ 未找到可上传的图片，跳过数据库更新")
                continue

            updated_content = content
            for src, dest in replacements:
                updated_content = updated_content.replace(src, dest)

            chapter.content = updated_content
            db.commit()
            success_chapters += 1
            uploaded_images += len(replacements)
            logger.info("✅ 章节内容已写回数据库")

            if supabase_client.enabled:
                try:
                    supabase_client.client.table('chapters')\
                        .update({'content': updated_content})\
                        .eq('id', chapter.id)\
                        .execute()
                    logger.info("✅ Supabase章节内容已同步")
                except Exception as e:
                    logger.warning(f"⚠️ Supabase章节同步失败: {e}")
        except Exception as e:
            logger.error(f"❌ 章节 {chapter.id} 迁移失败: {e}")
            db.rollback()
            failed_chapters += 1

    logger.info("\n" + "=" * 50)
    logger.info("📊 章节内容迁移完成")
    logger.info(f"章节成功: {success_chapters}")
    logger.info(f"章节失败: {failed_chapters}")
    logger.info(f"总共解析图片: {total_images}")
    if dry_run:
        logger.info(f"Dry Run 章节: {dry_run_chapters}")
        logger.info("实际上传图片: 0（预览模式）")
    else:
        logger.info(f"实际上传图片: {uploaded_images}")
    logger.info("=" * 50)


def main():
    parser = argparse.ArgumentParser(description="迁移本地图片到阿里云OSS")
    parser.add_argument('--dry-run', action='store_true', help='预览模式，不实际上传')
    args = parser.parse_args()

    if args.dry_run:
        logger.info("🔍 预览模式（不会实际上传）")

    db = SessionLocal()
    try:
        migrate_book_images(db, dry_run=args.dry_run)
        migrate_chapter_images(db, dry_run=args.dry_run)
    finally:
        db.close()


if __name__ == "__main__":
    main()
