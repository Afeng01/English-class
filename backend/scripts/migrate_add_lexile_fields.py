"""
数据库迁移脚本：为books表添加lexile、series、category字段
使用方法：python migrate_add_lexile_fields.py
"""
import sqlite3
import os
import sys
import logging

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


def migrate_database():
    """为books表添加新字段"""
    # 数据库路径
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(backend_dir, "data", "reading.db")

    if not os.path.exists(db_path):
        logger.error(f"数据库文件不存在: {db_path}")
        return False

    logger.info(f"连接数据库: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(books)")
        columns = [column[1] for column in cursor.fetchall()]

        logger.info(f"当前books表字段: {columns}")

        # 添加lexile字段
        if 'lexile' not in columns:
            logger.info("添加lexile字段...")
            cursor.execute("ALTER TABLE books ADD COLUMN lexile TEXT")
            logger.info("✅ lexile字段添加成功")
        else:
            logger.info("⏭️  lexile字段已存在，跳过")

        # 添加series字段
        if 'series' not in columns:
            logger.info("添加series字段...")
            cursor.execute("ALTER TABLE books ADD COLUMN series TEXT")
            logger.info("✅ series字段添加成功")
        else:
            logger.info("⏭️  series字段已存在，跳过")

        # 添加category字段
        if 'category' not in columns:
            logger.info("添加category字段...")
            cursor.execute("ALTER TABLE books ADD COLUMN category TEXT")
            logger.info("✅ category字段添加成功")
        else:
            logger.info("⏭️  category字段已存在，跳过")

        # 提交更改
        conn.commit()

        # 验证字段已添加
        cursor.execute("PRAGMA table_info(books)")
        new_columns = [column[1] for column in cursor.fetchall()]
        logger.info(f"更新后books表字段: {new_columns}")

        # 统计书籍数量
        cursor.execute("SELECT COUNT(*) FROM books")
        total_books = cursor.fetchone()[0]
        logger.info(f"数据库中共有 {total_books} 本书籍")

        # 统计有lexile值的书籍
        cursor.execute("SELECT COUNT(*) FROM books WHERE lexile IS NOT NULL AND lexile != ''")
        books_with_lexile = cursor.fetchone()[0]
        logger.info(f"其中 {books_with_lexile} 本书籍有蓝思值")

        logger.info("✅ 数据库迁移成功完成！")
        return True

    except Exception as e:
        logger.error(f"❌ 迁移失败: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == '__main__':
    success = migrate_database()
    sys.exit(0 if success else 1)
