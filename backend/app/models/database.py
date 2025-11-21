from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# 数据库路径
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "reading.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Book(Base):
    __tablename__ = "books"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    author = Column(String, default="Unknown")
    cover = Column(String)  # 封面图片路径
    level = Column(String)  # 难度等级：学前、一年级...
    word_count = Column(Integer, default=0)
    description = Column(Text)
    epub_path = Column(String)  # EPUB 文件路径
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关联
    chapters = relationship("Chapter", back_populates="book", cascade="all, delete-orphan")
    vocabulary = relationship("BookVocabulary", back_populates="book", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String, primary_key=True)
    book_id = Column(String, ForeignKey("books.id"), nullable=False)
    chapter_number = Column(Integer, nullable=False)
    title = Column(String)
    content = Column(Text)  # HTML 内容

    book = relationship("Book", back_populates="chapters")


class BookVocabulary(Base):
    __tablename__ = "book_vocabulary"

    id = Column(String, primary_key=True)
    book_id = Column(String, ForeignKey("books.id"), nullable=False)
    word = Column(String, nullable=False)
    frequency = Column(Integer, default=1)  # 出现次数
    phonetic = Column(String)
    definition = Column(Text)

    book = relationship("Book", back_populates="vocabulary")


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
