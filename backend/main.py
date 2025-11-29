from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import nltk
from dotenv import load_dotenv

# 加载.env文件中的环境变量
load_dotenv()

from app.api import books, dictionary, admin
from app.models.database import create_tables
from app.utils.oss_helper import oss_helper
from app.config import oss_config

app = FastAPI(title="English Reading App API", version="1.0.0")

# CORS 配置
# 从环境变量读取允许的源，支持生产环境动态配置
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"  # 默认本地开发环境
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],  # 去除可能的空格
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务（书籍封面等）
data_path = os.path.join(os.path.dirname(__file__), "data")
if os.path.exists(data_path):
    app.mount("/static", StaticFiles(directory=data_path), name="static")

# 注册路由
app.include_router(books.router, prefix="/api/books", tags=["books"])
app.include_router(dictionary.router, prefix="/api/dictionary", tags=["dictionary"])
app.include_router(admin.router, prefix="/api", tags=["admin"])

@app.on_event("startup")
async def startup():
    """应用启动时初始化"""
    create_tables()

    # 显示OSS配置状态
    print("\n" + "="*50)
    print("📦 图片存储配置")
    print("="*50)
    if oss_helper.enabled:
        print(f"✅ OSS存储已启用")
        print(f"   Bucket: {oss_config.bucket_name}")
        print(f"   Endpoint: {oss_config.endpoint}")
        print(f"   状态: 图片将自动上传到阿里云OSS")
    else:
        if oss_config.use_oss:
            print("⚠️  OSS配置不完整或初始化失败")
            print("   将使用本地存储作为备选方案")
        else:
            print("💾 使用本地存储")
            print("   图片将保存到: backend/data/images/")
    print("="*50 + "\n")

    # 下载 NLTK 数据（词形还原所需）
    # 这些数据用于将词形变化还原为原形，如 running → run, went → go
    # 只在首次启动时下载，之后会使用缓存
    try:
        nltk.data.find('corpora/wordnet')
        nltk.data.find('corpora/omw-1.4')
        nltk.data.find('taggers/averaged_perceptron_tagger')
        print("✅ NLTK数据已就绪")
    except LookupError:
        print("⏬ 正在下载NLTK数据（仅首次需要，约5MB）...")
        nltk.download('wordnet', quiet=True)
        nltk.download('omw-1.4', quiet=True)
        nltk.download('averaged_perceptron_tagger', quiet=True)
        print("✅ NLTK数据下载完成")

@app.get("/")
@app.head("/")
async def root():
    """健康检查端点，支持GET和HEAD请求（用于UptimeRobot等监控服务）"""
    return {"message": "English Reading App API"}
