"""
EPUB 书籍导入脚本
用法: python import_book.py <epub_file> [--level <level>]
"""
import argparse
import os
import re
import sys
import uuid
from collections import Counter

import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.database import SessionLocal, create_tables, Book, Chapter, BookVocabulary


def extract_text_from_html(html_content: str) -> str:
    """从 HTML 中提取纯文本"""
    soup = BeautifulSoup(html_content, 'html.parser')
    return soup.get_text(separator=' ', strip=True)


def extract_words(text: str) -> list:
    """提取文本中的单词"""
    # 只保留英文单词，转小写
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    # 过滤掉太短的词
    return [w for w in words if len(w) > 2]


def import_epub(epub_path: str, level: str = None) -> str:
    """
    导入 EPUB 文件到数据库
    返回书籍 ID
    """
    if not os.path.exists(epub_path):
        raise FileNotFoundError(f"EPUB file not found: {epub_path}")

    # 读取 EPUB
    book = epub.read_epub(epub_path)

    # 获取元数据
    title = book.get_metadata('DC', 'title')
    title = title[0][0] if title else os.path.basename(epub_path).replace('.epub', '')

    author = book.get_metadata('DC', 'creator')
    author = author[0][0] if author else "Unknown"

    description = book.get_metadata('DC', 'description')
    description = description[0][0] if description else ""

    # 生成书籍 ID
    book_id = str(uuid.uuid4())

    # 提取章节内容
    chapters_data = []
    all_words = []
    chapter_num = 0

    for item in book.get_items():
        if item.get_type() == ebooklib.ITEM_DOCUMENT:
            content = item.get_content().decode('utf-8', errors='ignore')

            # 提取章节标题
            soup = BeautifulSoup(content, 'html.parser')
            title_tag = soup.find(['h1', 'h2', 'h3', 'title'])
            chapter_title = title_tag.get_text(strip=True) if title_tag else f"Chapter {chapter_num + 1}"

            # 提取文本用于词频统计
            text = extract_text_from_html(content)
            words = extract_words(text)
            all_words.extend(words)

            chapter_num += 1
            chapters_data.append({
                'id': str(uuid.uuid4()),
                'book_id': book_id,
                'chapter_number': chapter_num,
                'title': chapter_title,
                'content': content
            })

    # 统计词频
    word_counts = Counter(all_words)
    total_words = len(all_words)

    # 取高频词（出现次数 >= 3 且不是常见虚词）
    common_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
                    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why',
                    'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
                    'those', 'for', 'with', 'about', 'against', 'between', 'into',
                    'through', 'during', 'before', 'after', 'above', 'below', 'from',
                    'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
                    'further', 'then', 'once', 'here', 'there', 'all', 'each', 'few',
                    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
                    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now',
                    'you', 'your', 'yours', 'yourself', 'he', 'him', 'his', 'himself',
                    'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they',
                    'them', 'their', 'theirs', 'themselves', 'we', 'us', 'our', 'ours',
                    'ourselves', 'said', 'say', 'says', 'saying', 'got', 'get', 'gets',
                    'getting', 'went', 'go', 'goes', 'going', 'come', 'comes', 'coming',
                    'came', 'see', 'saw', 'seen', 'look', 'looked', 'looking', 'looks'}

    high_freq_words = [(word, count) for word, count in word_counts.most_common(200)
                       if count >= 3 and word not in common_words][:100]

    # 保存到数据库
    db = SessionLocal()
    try:
        # 创建书籍记录
        db_book = Book(
            id=book_id,
            title=title,
            author=author,
            level=level,
            word_count=total_words,
            description=description,
            epub_path=epub_path
        )
        db.add(db_book)

        # 创建章节记录
        for chapter_data in chapters_data:
            db_chapter = Chapter(**chapter_data)
            db.add(db_chapter)

        # 创建词汇记录
        for word, freq in high_freq_words:
            db_vocab = BookVocabulary(
                id=str(uuid.uuid4()),
                book_id=book_id,
                word=word,
                frequency=freq
            )
            db.add(db_vocab)

        db.commit()
        print(f"✅ Successfully imported: {title}")
        print(f"   - Author: {author}")
        print(f"   - Chapters: {len(chapters_data)}")
        print(f"   - Total words: {total_words}")
        print(f"   - High-freq vocabulary: {len(high_freq_words)}")
        print(f"   - Book ID: {book_id}")

        return book_id

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description='Import EPUB book to database')
    parser.add_argument('epub_file', help='Path to EPUB file')
    parser.add_argument('--level', '-l', help='Book level (e.g., 学前, 一年级, 初一)')

    args = parser.parse_args()

    # 确保数据库表存在
    create_tables()

    # 导入书籍
    import_epub(args.epub_file, args.level)


if __name__ == '__main__':
    main()
