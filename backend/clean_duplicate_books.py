"""
清理重复书籍的脚本
保留OSS存储的版本，删除本地存储的旧版本
"""
import sys
from collections import defaultdict

from app.models.database import SessionLocal, Book, Chapter, BookVocabulary
from app.utils.oss_helper import oss_helper

def clean_duplicates():
    """清理重复书籍，保留最新的OSS版本"""
    db = SessionLocal()

    try:
        # 获取所有书籍
        books = db.query(Book).all()
        print(f"📚 数据库中共有 {len(books)} 本书\n")

        # 按书名分组
        book_groups = defaultdict(list)
        for book in books:
            book_groups[book.title].append(book)

        # 找出重复的书籍
        duplicates = {title: books_list for title, books_list in book_groups.items() if len(books_list) > 1}

        if not duplicates:
            print("✅ 没有重复书籍，数据库很干净！")
            return

        print(f"⚠️  发现 {len(duplicates)} 个重复书名:\n")

        total_removed = 0

        for title, books_list in duplicates.items():
            print(f"📖 {title}")
            print(f"   共有 {len(books_list)} 个副本:")

            # 按优先级排序：OSS > 本地，创建时间新 > 旧
            books_list.sort(key=lambda b: (
                not (b.cover and b.cover.startswith('https://')),  # OSS优先
                b.created_at  # 时间早的优先
            ))

            # 保留第一个（优先级最高）
            keep_book = books_list[0]
            remove_books = books_list[1:]

            for idx, book in enumerate(books_list):
                storage_type = "OSS" if book.cover and book.cover.startswith('https://') else "本地"
                status = "✅保留" if book == keep_book else "❌删除"
                print(f"   {status} [{storage_type}] ID: {book.id[:8]}... | 创建时间: {book.created_at}")

            # 执行删除
            for book in remove_books:
                book_id = book.id

                # 删除章节
                db.query(Chapter).filter(Chapter.book_id == book_id).delete()

                # 删除词汇
                db.query(BookVocabulary).filter(BookVocabulary.book_id == book_id).delete()

                # 如果是OSS图片，删除OSS资源
                if book.cover and book.cover.startswith('https://'):
                    if oss_helper.enabled:
                        oss_helper.delete_images(book_id)
                        print(f"      - 已删除OSS图片")

                # 如果是本地图片，删除本地目录
                else:
                    import os
                    import shutil
                    backend_dir = os.path.dirname(os.path.abspath(__file__))
                    oss_helper.delete_local_images(book_id, backend_dir)
                    print(f"      - 已删除本地图片")

                # 删除书籍记录
                db.delete(book)
                total_removed += 1

            print()

        # 提交更改
        db.commit()
        print(f"✅ 清理完成！共删除 {total_removed} 本重复书籍")
        print(f"📊 剩余书籍: {len(books) - total_removed} 本\n")

    except Exception as e:
        db.rollback()
        print(f"❌ 清理失败: {e}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()


def main():
    print("\n" + "="*60)
    print("🧹 清理重复书籍")
    print("="*60)
    print("\n⚠️  警告：此操作将删除重复的书籍数据！")
    print("策略：保留OSS存储的最新版本，删除本地存储的旧版本\n")

    confirm = input("确认要继续吗？(yes/no): ")

    if confirm.lower() != 'yes':
        print("\n❌ 操作已取消\n")
        sys.exit(0)

    clean_duplicates()


if __name__ == '__main__':
    main()
