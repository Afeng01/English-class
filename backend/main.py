from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

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
    create_tables()

@app.get("/")
async def root():
    return {"message": "English Reading App API"}
