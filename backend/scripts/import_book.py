"""
EPUB 书籍导入脚本
用法: python import_book.py <epub_file> [--level <level>]
"""
import argparse
import os
import re
import sys
import uuid
import shutil
import logging
from collections import Counter

import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.database import SessionLocal, create_tables, Book, Chapter, BookVocabulary
from app.utils.oss_helper import oss_helper
from app.utils.supabase_client import supabase_client

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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


def detect_chapter_type(soup, text: str) -> tuple[str, str]:
    """
    检测章节类型并提取标题
    返回: (chapter_type, title)
    chapter_type: 'cover', 'toc', 'frontmatter', 'chapter', 'testimonial', 'skip'
    """
    # 标准化引号和其他特殊字符
    text_normalized = text.replace(''', "'").replace(''', "'").replace('"', '"').replace('"', '"')
    text_lower = text_normalized.lower()
    images = soup.find_all('img')

    # 先获取标题标签内容
    title_tag = soup.find(['h1', 'h2', 'h3'])
    title_text = title_tag.get_text(strip=True) if title_tag else ''
    title_lower = title_text.lower()

    # 检测封面：有图片 + 文字很少 + 标题含"封面/cover"或无标题
    if images and len(text.strip()) < 100:
        if '封面' in title_lower or 'cover' in title_lower or not title_text:
            return 'cover', '封面'

    # 检测只有图片几乎没有文字的页面 - 跳过
    if images and len(text.strip()) < 30 and not title_text:
        return 'skip', ''

    # 检测扉页（Title Page）- 包含书名和作者但不是正文
    if images and len(text.strip()) < 150:
        if re.search(r'\bby\s+[A-Z][a-z]+', text):
            return 'skip', ''

    # 检测标题为前言/封面等的页面
    skip_title_keywords = ['封面', 'cover', '扉页', 'title page']
    frontmatter_title_keywords = ['前言', '版权', '序言', 'preface', 'copyright', 'foreword', 'dedication']

    if any(keyword in title_lower for keyword in skip_title_keywords):
        return 'skip', ''

    if any(keyword in title_lower for keyword in frontmatter_title_keywords):
        return 'frontmatter', '前言'

    # 检测目录
    if any(keyword in text_lower for keyword in ['table of contents', 'contents', '目录']):
        return 'toc', '目录'

    # 检测推荐语/读者评价
    testimonial_keywords = [
        "what kids have to say",
        "here's what kids",
        "teachers and librarians love",
        "what readers are saying",
        "praise for",
        "reviews",
        "读者评价",
        "推荐语",
        "i love your books",
        "best author",
        "imagination like no other"
    ]
    if any(keyword in text_lower for keyword in testimonial_keywords):
        return 'testimonial', '推荐语'

    # 检测附加内容（bonus、podcast、补充材料等）
    bonus_keywords = [
        'podcast',
        'bonus chapter',
        'bonus content',
        'extra chapter',
        'supplementary',
        'appendix',
        'about the author',
        'author note',
        'acknowledgments',
        '附录',
        '作者说明',
        '补充材料'
    ]
    if any(keyword in text_lower for keyword in bonus_keywords):
        return 'skip', ''

    # 检测广告/推广内容
    promo_keywords = [
        'visit www.',
        'order the cd',
        'musical cd',
        'for more information',
        'www.mthmusical',
        '订购',
        '更多信息请访问'
    ]
    if any(keyword in text_lower for keyword in promo_keywords):
        return 'skip', ''

    # 检测书籍目录/系列广告
    booklist_keywords = [
        'magic tree house',
        '#1:',
        '#2:',
        '#3:',
        'other books in this series',
        'also available',
        '系列丛书',
        '更多图书'
    ]
    # 书目页特征：包含多个书名编号
    book_number_count = len(re.findall(r'#\d+:', text))
    if book_number_count >= 3:
        return 'skip', ''
    if any(keyword in text_lower for keyword in booklist_keywords) and book_number_count >= 2:
        return 'skip', ''

    # 检测前言/版权/献辞等（内容检测）
    frontmatter_keywords = [
        'copyright', 'all rights reserved', 'published by',
        'dedication', 'acknowledgment', 'preface', 'foreword',
        'isbn', '版权', '前言', '序言', '献给'
    ]
    if any(keyword in text_lower for keyword in frontmatter_keywords):
        return 'frontmatter', '前言'

    # 检测献辞格式 "For xxx, who xxx" 或 "For xxx and xxx"
    if re.match(r'^for\s+[a-z]+(\s+and\s+[a-z]+)?,?\s+(who|with)', text_lower.strip()):
        return 'frontmatter', '献辞'

    # 检测内容很少的页面（可能是分隔页或空白页）
    if len(text.strip()) < 50:
        return 'skip', ''

    # 尝试检测真正的章节标题（如 "1 Into the Woods"）
    if title_text:
        # 匹配 "1 Title" 或 "Chapter 1 Title" 格式
        chapter_num_match = re.match(r'^(\d+)\s+(.+)$', title_text)
        if chapter_num_match:
            return 'chapter', title_text

    # 检测 "Chapter X" 格式
    chapter_match = re.search(r'chapter\s+(\d+)', text_lower)
    if chapter_match:
        # 检查是否实际上是推荐语内容
        if any(keyword in text_lower for keyword in ['love your books', 'best author', 'imagination']):
            return 'testimonial', '推荐语'

        chapter_num = chapter_match.group(1)
        if title_text:
            return 'chapter', title_text
        return 'chapter', f'Chapter {chapter_num}'

    # 默认尝试从标题标签获取
    if title_text:
        return 'chapter', title_text

    return 'chapter', ''


def is_substantial_chapter(text: str, min_words: int = 100) -> bool:
    """
    判断是否是有实质内容的章节
    过滤掉只有一两句话的章节

    Args:
        text: 章节文本内容
        min_words: 最少单词数，默认100

    Returns:
        True表示是有效章节，False表示应该跳过
    """
    # 提取单词
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    word_count = len([w for w in words if len(w) > 2])

    # 检查单词数是否足够
    if word_count < min_words:
        return False

    # 检查句子数（通过句号、问号、感叹号计数）
    sentences = re.split(r'[.!?]+', text)
    sentence_count = len([s for s in sentences if s.strip() and len(s.strip()) > 10])

    # 至少需要3个有效句子
    if sentence_count < 3:
        return False

    return True


def extract_real_chapter_number(text: str) -> int:
    """从文本中提取真正的章节编号"""
    # 匹配 "Chapter X" 或 "第X章" 格式
    match = re.search(r'chapter\s+(\d+)', text.lower())
    if match:
        return int(match.group(1))

    match = re.search(r'第\s*(\d+)\s*章', text)
    if match:
        return int(match.group(1))

    return 0


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

    # 从 EPUB 目录中提取章节标题映射
    toc_titles = {}  # 文件名 -> 标题
    for item in book.toc:
        if isinstance(item, epub.Link):
            # 提取文件名（不含锚点）
            href = item.href.split('#')[0]
            toc_titles[href] = item.title
        elif isinstance(item, tuple):
            # 嵌套目录结构
            section, links = item
            for link in links:
                if isinstance(link, epub.Link):
                    href = link.href.split('#')[0]
                    toc_titles[href] = link.title

    # 创建书籍图片目录（本地存储fallback）
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    images_dir = os.path.join(backend_dir, "data", "images", book_id)

    # 查找封面图片ID（从metadata中）
    cover_image_id = None
    for meta in book.get_metadata('OPF', 'cover'):
        if meta:
            cover_image_id = meta[0]
            logger.info(f"从metadata找到封面ID: {cover_image_id}")
            break

    # 提取并保存所有图片，建立映射关系
    image_map = {}  # 原始路径 -> 新URL
    cover_path = None
    cover_candidates = []  # 封面候选列表

    for item in book.get_items():
        if item.get_type() == ebooklib.ITEM_IMAGE:
            # 获取图片文件名
            item_name = item.get_name()
            file_name = os.path.basename(item_name)

            # 生成唯一文件名避免冲突
            unique_name = f"{uuid.uuid4().hex[:8]}_{file_name}"
            image_data = item.get_content()

            # 尝试上传到OSS，失败则使用本地存储
            try:
                if oss_helper.enabled:
                    # 上传到OSS
                    object_name = f"{book_id}/{unique_name}"
                    new_url = oss_helper.upload_image(image_data, object_name)
                    logger.info(f"图片已上传到OSS: {object_name}")
                else:
                    # 使用本地存储
                    os.makedirs(images_dir, exist_ok=True)
                    save_path = os.path.join(images_dir, unique_name)
                    new_url = oss_helper.save_image_local(image_data, save_path)
                    logger.info(f"图片已保存到本地: {save_path}")

            except Exception as e:
                # OSS上传失败，fallback到本地存储
                logger.warning(f"OSS上传失败，使用本地存储: {e}")
                os.makedirs(images_dir, exist_ok=True)
                save_path = os.path.join(images_dir, unique_name)
                new_url = oss_helper.save_image_local(image_data, save_path)

            # 建立映射：各种可能的引用路径 -> 新URL
            image_map[item_name] = new_url
            image_map[file_name] = new_url
            image_map[os.path.basename(item_name)] = new_url

            # 相对路径变体
            if '/' in item_name:
                image_map['../' + item_name] = new_url
                image_map['./' + item_name] = new_url

            # 检查是否为封面图片
            is_cover = False

            # 方法1：检查是否匹配metadata中的cover ID
            if cover_image_id:
                # cover_image_id可能是item的id或文件名
                if (item.get_id() == cover_image_id or
                    file_name == cover_image_id or
                    item_name == cover_image_id or
                    item_name.endswith(cover_image_id)):
                    cover_path = new_url
                    is_cover = True
                    logger.info(f"✅ 找到封面图片（通过metadata）: {file_name}")

            # 方法2：检查文件名是否包含"cover"关键词
            if not is_cover:
                file_lower = file_name.lower()
                item_lower = item_name.lower()
                if ('cover' in file_lower or 'cover' in item_lower or
                    'cov' in file_lower):  # 有些命名为cov.jpg
                    cover_candidates.append((new_url, file_name, 1))  # 优先级1
                    logger.info(f"📌 找到封面候选（文件名包含cover）: {file_name}")
                # 检查是否在images根目录且文件名简单（如cover.jpg, image001.jpg）
                elif '/' not in item_name or item_name.count('/') <= 1:
                    # 根目录的图片更可能是封面
                    cover_candidates.append((new_url, file_name, 2))  # 优先级2

    # 如果还没有找到封面，从候选列表中选择优先级最高的
    if not cover_path and cover_candidates:
        # 按优先级排序（优先级数字越小越优先）
        cover_candidates.sort(key=lambda x: x[2])
        cover_path = cover_candidates[0][0]
        logger.info(f"✅ 选择封面（从候选中）: {cover_candidates[0][1]}")

    # 如果仍然没有封面，使用第一张图片（fallback）
    if not cover_path and image_map:
        cover_path = list(image_map.values())[0]
        logger.warning(f"⚠️  使用第一张图片作为封面（fallback）")

    # 提取章节内容
    chapters_data = []
    all_words = []

    for item in book.get_items():
        if item.get_type() == ebooklib.ITEM_DOCUMENT:
            content = item.get_content().decode('utf-8', errors='ignore')
            item_name = item.get_name()  # 获取文档文件名

            # 替换图片路径
            soup = BeautifulSoup(content, 'html.parser')

            for img in soup.find_all('img'):
                src = img.get('src', '')
                # 尝试多种匹配方式
                new_src = None
                for old_path, new_path in image_map.items():
                    if old_path in src or src.endswith(old_path) or os.path.basename(src) == os.path.basename(old_path):
                        new_src = new_path
                        break
                if new_src:
                    img['src'] = new_src

            # 也处理 image 标签 (SVG 中可能用到)
            for img in soup.find_all('image'):
                href = img.get('xlink:href', '') or img.get('href', '')
                for old_path, new_path in image_map.items():
                    if old_path in href or href.endswith(old_path):
                        if img.get('xlink:href'):
                            img['xlink:href'] = new_path
                        if img.get('href'):
                            img['href'] = new_path
                        break

            content = str(soup)

            # 提取文本用于分析
            text = extract_text_from_html(content)
            words = extract_words(text)
            all_words.extend(words)

            # 检测章节类型和标题
            chapter_type, detected_title = detect_chapter_type(soup, text)

            # 只保留正文章节，跳过所有前置内容
            if chapter_type in ('skip', 'cover', 'toc', 'frontmatter', 'testimonial'):
                continue

            # 优先从 TOC 获取标题
            toc_title = toc_titles.get(item_name, '')
            if toc_title:
                # 清理标题中的章节编号前缀（如 "1. Into the Woods" -> "Into the Woods"）
                cleaned_title = re.sub(r'^(\d+)\.\s*', '', toc_title)
                detected_title = cleaned_title if cleaned_title else toc_title

            # 提取真正的章节编号
            real_chapter_num = extract_real_chapter_number(text)

            # 正文章节
            if real_chapter_num > 0:
                display_chapter_num = real_chapter_num
            else:
                # 从标题中提取数字（如 "1 Into the Woods"）
                title_num_match = re.match(r'^(\d+)\s+', detected_title)
                if title_num_match:
                    display_chapter_num = int(title_num_match.group(1))
                else:
                    display_chapter_num = len(chapters_data) + 1

            # 如果没有检测到标题，使用默认值
            if not detected_title:
                detected_title = f'Chapter {display_chapter_num}'

            chapters_data.append({
                'id': str(uuid.uuid4()),
                'book_id': book_id,
                'chapter_number': display_chapter_num,
                'title': detected_title,
                'content': content,
                'word_count': len(words)
            })

    # 按章节编号排序
    chapters_data.sort(key=lambda x: x['chapter_number'])

    # 重新编号：从1开始连续
    for i, chapter in enumerate(chapters_data):
        chapter['chapter_number'] = i + 1

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
            cover=cover_path,  # 设置封面
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

        # 同时写入Supabase（如果已配置）
        if supabase_client.enabled:
            try:
                logger.info("📤 开始同步数据到Supabase...")

                # 1. 插入书籍数据
                book_data_for_supabase = {
                    'id': book_id,
                    'title': title,
                    'author': author,
                    'cover': cover_path,
                    'level': level,
                    'word_count': total_words,
                    'description': description,
                    'epub_path': epub_path,
                }
                supabase_client.insert_book(book_data_for_supabase)

                # 2. 批量插入章节数据
                chapters_for_supabase = []
                for chapter_data in chapters_data:
                    chapters_for_supabase.append({
                        'id': chapter_data['id'],
                        'book_id': chapter_data['book_id'],
                        'chapter_number': chapter_data['chapter_number'],
                        'title': chapter_data.get('title'),
                        'content': chapter_data['content'],
                        'word_count': chapter_data['word_count'],
                    })
                supabase_client.bulk_insert_chapters(chapters_for_supabase)

                # 3. 批量插入词汇数据
                vocab_for_supabase = []
                for word, freq in high_freq_words:
                    vocab_for_supabase.append({
                        'id': str(uuid.uuid4()),
                        'book_id': book_id,
                        'word': word,
                        'frequency': freq,
                    })
                supabase_client.bulk_insert_vocabulary(vocab_for_supabase)

                logger.info("✅ 数据已成功同步到Supabase")
            except Exception as e:
                logger.warning(f"⚠️ Supabase同步失败（不影响本地SQLite）: {e}")

        print(f"✅ Successfully imported: {title}")
        print(f"   - Author: {author}")
        print(f"   - Chapters: {len(chapters_data)}")
        print(f"   - Total words: {total_words}")
        print(f"   - High-freq vocabulary: {len(high_freq_words)}")
        print(f"   - Images: {len(image_map) // 3}")  # 除以3因为每张图有多个映射
        print(f"   - Cover: {cover_path}")
        print(f"   - Book ID: {book_id}")

        return book_id

    except Exception as e:
        db.rollback()
        # 清理已创建的图片
        logger.error(f"导入书籍失败，清理图片资源: {e}")

        # 清理OSS图片
        if oss_helper.enabled:
            oss_helper.delete_images(book_id)

        # 清理本地图片目录
        if os.path.exists(images_dir):
            shutil.rmtree(images_dir)

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
