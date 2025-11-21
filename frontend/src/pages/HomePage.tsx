import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import type { Book } from '../types';
import { progressStorage } from '../services/storage';

export default function HomePage() {
  const navigate = useNavigate();
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentBooks();
  }, []);

  const loadRecentBooks = async () => {
    try {
      setLoading(true);
      // 获取所有书籍
      const response = await booksAPI.getBooks();
      const allBooks = response.data;

      // 获取阅读进度
      const progress = progressStorage.getAll();
      const progressList = Object.values(progress);

      // 按最近阅读时间排序
      const sorted = progressList
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 3)
        .map((p) => allBooks.find((b) => b.id === p.book_id))
        .filter(Boolean) as Book[];

      setRecentBooks(sorted);
    } catch (error) {
      console.error('Failed to load recent books:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">英语分级阅读</h1>
          <nav className="flex gap-4">
            <button
              onClick={() => navigate('/books')}
              className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition"
            >
              书籍库
            </button>
            <button
              onClick={() => navigate('/vocabulary')}
              className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition"
            >
              我的词库
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero section */}
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            通过阅读原著<br />提升英语能力
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            分级书籍 · 沉浸式阅读 · 即时查词 · 词汇积累
          </p>
          <button
            onClick={() => navigate('/books')}
            className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
            开始阅读
          </button>
        </section>

        {/* Recent books */}
        {recentBooks.length > 0 && (
          <section className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">最近阅读</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {recentBooks.map((book) => {
                const progress = progressStorage.get(book.id);
                const percentage = progress
                  ? Math.round((progress.current_chapter / (book as any).chapters?.length || 1) * 100)
                  : 0;

                return (
                  <div
                    key={book.id}
                    onClick={() => navigate(`/books/${book.id}`)}
                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
                  >
                    <div className="aspect-[16/9] bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      {book.cover ? (
                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-white text-center p-6">
                          <div className="text-xl font-bold">{book.title}</div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-lg mb-1 truncate">{book.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{book.author}</p>
                      <div className="bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">已读 {percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h4 className="font-bold text-lg mb-2">分级阅读</h4>
            <p className="text-gray-600 text-sm">
              根据英语难度分级，从学前到高中，循序渐进
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h4 className="font-bold text-lg mb-2">即时查词</h4>
            <p className="text-gray-600 text-sm">
              点击任意单词即可查看释义、发音，降低阅读障碍
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h4 className="font-bold text-lg mb-2">词汇积累</h4>
            <p className="text-gray-600 text-sm">
              自动保存生词到个人词库，随时复习巩固
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
