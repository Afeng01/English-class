"""
问题诊断和修复脚本
"""
import os
from dotenv import load_dotenv

load_dotenv()

print("\n" + "="*60)
print("🔍 系统诊断")
print("="*60)

# 检查1：有道词典API配置
print("\n1️⃣ 检查有道词典API配置")
youdao_key = os.getenv('YOUDAO_APP_KEY', '')
youdao_secret = os.getenv('YOUDAO_APP_SECRET', '')

if not youdao_key or youdao_key == 'your_app_key_here':
    print("   ❌ YOUDAO_APP_KEY 未正确配置")
    print("   解决方案：请在.env文件中填写真实的AppKey")
    print("   申请地址：https://ai.youdao.com/")
else:
    print(f"   ✅ YOUDAO_APP_KEY 已配置: {youdao_key[:10]}...")

if not youdao_secret or youdao_secret == 'your_app_secret_here':
    print("   ❌ YOUDAO_APP_SECRET 未正确配置")
    print("   解决方案：请在.env文件中填写真实的AppSecret")
else:
    print(f"   ✅ YOUDAO_APP_SECRET 已配置: {youdao_secret[:10]}...")

# 检查2：OSS配置
print("\n2️⃣ 检查OSS配置")
use_oss = os.getenv('USE_OSS', 'false').lower() == 'true'
if use_oss:
    print("   ✅ OSS已启用")
    oss_key = os.getenv('OSS_ACCESS_KEY_ID', '')
    oss_secret = os.getenv('OSS_ACCESS_KEY_SECRET', '')
    oss_endpoint = os.getenv('OSS_ENDPOINT', '')
    oss_bucket = os.getenv('OSS_BUCKET_NAME', '')

    if oss_key and oss_key != 'your_access_key_id_here':
        print(f"   ✅ OSS_ACCESS_KEY_ID: {oss_key[:10]}...")
    else:
        print("   ❌ OSS_ACCESS_KEY_ID 未正确配置")

    if oss_bucket and oss_bucket != 'your_bucket_name_here':
        print(f"   ✅ OSS_BUCKET_NAME: {oss_bucket}")
        print(f"   ⚠️  请确保Bucket权限设置为【公共读】")
        print(f"      控制台链接: https://oss.console.aliyun.com/bucket/oss-cn-hongkong/{oss_bucket}/permission/acl")
    else:
        print("   ❌ OSS_BUCKET_NAME 未正确配置")
else:
    print("   💾 使用本地存储")

# 检查3：数据库中的书籍
print("\n3️⃣ 检查数据库中的书籍")
try:
    from app.models.database import SessionLocal, Book
    db = SessionLocal()
    books = db.query(Book).all()

    print(f"   📚 共有 {len(books)} 本书")

    # 按书名分组检查重复
    from collections import defaultdict
    book_groups = defaultdict(list)
    for book in books:
        book_groups[book.title].append(book)

    duplicates = {title: books_list for title, books_list in book_groups.items() if len(books_list) > 1}

    if duplicates:
        print(f"\n   ⚠️  发现 {len(duplicates)} 个重复书名:")
        for title, books_list in duplicates.items():
            print(f"      - {title}: {len(books_list)} 个副本")
            for book in books_list:
                print(f"        ID: {book.id[:8]}... | 封面: {book.cover[:50]}...")
    else:
        print("   ✅ 没有重复书籍")

    # 检查封面URL类型
    oss_covers = [b for b in books if b.cover and b.cover.startswith('https://')]
    local_covers = [b for b in books if b.cover and b.cover.startswith('/static/')]

    print(f"\n   📊 封面存储统计:")
    print(f"      - OSS存储: {len(oss_covers)} 本")
    print(f"      - 本地存储: {len(local_covers)} 本")

    db.close()
except Exception as e:
    print(f"   ❌ 数据库检查失败: {e}")

# 检查4：依赖安装
print("\n4️⃣ 检查依赖安装")
try:
    import oss2
    print("   ✅ oss2 已安装")
except ImportError:
    print("   ❌ oss2 未安装")
    print("   解决方案：pip install oss2==2.18.4")

try:
    import nltk
    print("   ✅ nltk 已安装")
except ImportError:
    print("   ❌ nltk 未安装")

print("\n" + "="*60)
print("🎯 诊断完成")
print("="*60)
print("\n📝 建议操作:")
print("1. 如果有道API未配置，编辑.env文件填写真实密钥")
print("2. 如果OSS已启用，确保Bucket权限设置为【公共读】")
print("3. 如果有重复书籍，可以删除多余的副本")
print("4. 重启后端服务使配置生效\n")
