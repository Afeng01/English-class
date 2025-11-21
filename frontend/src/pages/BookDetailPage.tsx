import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import type { BookDetail, Vocabulary } from '../types';
import { progressStorage } from '../services/storage';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBook(id);
    }
  }, [id]);

  const loadBook = async (bookId: string) => {
    try {
      setLoading(true);
      const [bookRes, vocabRes] = await Promise.all([
        booksAPI.getBook(bookId),
        booksAPI.getVocabulary(bookId, 50),
      ]);
      setBook(bookRes.data);
      setVocabulary(vocabRes.data);
    } catch (error) {
      console.error('Failed to load book:', error);
    } finally {
      setLoading(false);
    }
  };

  const startReading = () => {
    if (!book) return;

    // 检查是否有阅读进度
    const progress = progressStorage.get(book.id);
    const chapter = progress?.current_chapter || 1;

    navigate(`/reader/${book.id}?chapter=${chapter}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">书籍未找到</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/books')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-900">书籍详情</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Book cover and info */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
              {/* Cover */}
              <div className="aspect-[2/3] bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white text-center p-8">
                    <div className="text-3xl font-bold mb-2">{book.title}</div>
                    <div className="text-lg opacity-90">{book.author}</div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{book.title}</h2>
                  <p className="text-gray-600">{book.author}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {book.level && (
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {book.level}
                    </span>
                  )}
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {book.word_count.toLocaleString()} 词
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {book.chapters.length} 章节
                  </span>
                </div>

                <button
                  onClick={startReading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  开始阅读
                </button>
              </div>
            </div>
          </div>

          {/* Right: Description and vocabulary */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            {book.description && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">简介</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            )}

            {/* High-frequency vocabulary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">高频生词预览</h3>
              {vocabulary.length === 0 ? (
                <p className="text-gray-500">暂无词汇数据</p>
              ) : (
                <div className="grid gap-3">
                  {vocabulary.map((vocab) => (
                    <div
                      key={vocab.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-bold text-lg">{vocab.word}</span>
                        {vocab.phonetic && (
                          <span className="text-gray-500 text-sm">{vocab.phonetic}</span>
                        )}
                        <span className="ml-auto text-xs text-gray-400">
                          出现 {vocab.frequency} 次
                        </span>
                      </div>
                      {vocab.definition && (
                        <p className="text-gray-600 mt-2 text-sm">{vocab.definition}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter list */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">章节列表</h3>
              <div className="space-y-2">
                {book.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/reader/${book.id}?chapter=${chapter.chapter_number}`)}
                  >
                    <span className="font-medium">
                      第 {chapter.chapter_number} 章
                      {chapter.title && `: ${chapter.title}`}
                    </span>
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
