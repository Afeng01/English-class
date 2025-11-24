from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import nltk
from dotenv import load_dotenv

# 加载.env文件中的环境变量
load_dotenv()

from app.api import books, dictionary
from app.models.database import create_tables

app = FastAPI(title="English Reading App API", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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

@app.on_event("startup")
async def startup():
    """应用启动时初始化"""
    create_tables()

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
async def root():
    return {"message": "English Reading App API"}
