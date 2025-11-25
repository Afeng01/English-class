import { useState, useEffect } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { booksAPI } from '../services/api';
import { useAppStore } from '../stores/useAppStore';
import type { Book } from '../types';

type Page = 'home' | 'shelf' | 'vocab' | 'reader';

interface ShelfPageProps {
  onNavigate: (page: Page) => void;
}

export default function ShelfPage({ onNavigate }: ShelfPageProps | {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setCurrentBook = useAppStore(state => state.setCurrentBook);

  // 处理可能未传入onNavigate的情况
  const navigate = (onNavigate as (page: Page) => void) || (() => {});

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks();
      setBooks(response.data);
    } catch (err) {
      console.error('Failed to load books:', err);
      setError('无法加载书籍列表');
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (book: Book) => {
    setCurrentBook(book);
    if (navigate) {
      navigate('reader');
    }
  };

  return (
    <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">全部馆藏资源</h2>

      <div className="flex gap-6">
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm sticky top-24">
            <h3 className="font-bold text-gray-700 mb-4">分类</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center justify-between cursor-pointer hover:text-teal-700 font-medium text-teal-700">
                <span>虚构类 (Fiction)</span>
                <span className="bg-teal-50 text-teal-600 px-1.5 rounded text-xs">120</span>
              </li>
              <li className="flex items-center justify-between cursor-pointer hover:text-teal-700">
                <span>非虚构 (Non-fiction)</span>
                <span className="bg-gray-100 text-gray-500 px-1.5 rounded text-xs">45</span>
              </li>
              <li className="flex items-center justify-between cursor-pointer hover:text-teal-700">
                <span>科学 (Science)</span>
                <span className="bg-gray-100 text-gray-500 px-1.5 rounded text-xs">12</span>
              </li>
            </ul>
            <div className="w-full h-px bg-gray-100 my-4"></div>
            <h3 className="font-bold text-gray-700 mb-4">难度</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" /> CN 小学段
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" /> CN 初中段
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" /> CN 高中段
              </label>
            </div>
          </div>
        </aside>

        <div className="flex-grow">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索书名、作者..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading && (
              <div className="col-span-full text-center py-10 text-gray-500">
                加载中...
              </div>
            )}

            {error && (
              <div className="col-span-full text-center py-10 text-red-500">
                {error}
              </div>
            )}

            {!loading && !error && books.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                暂无书籍
              </div>
            )}

            {!loading && !error && books.map((book) => (
              <div key={book.id} className="group cursor-pointer" onClick={() => handleBookClick(book)}>
                <div className="aspect-[2/3] bg-white border border-gray-200 rounded-lg shadow-sm mb-3 flex items-center justify-center relative overflow-hidden group-hover:shadow-md transition-all">
                  {book.cover ? (
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <BookOpen className={`w-12 h-12 text-gray-200 group-hover:text-teal-200 transition-colors ${book.cover ? 'hidden' : ''}`} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-teal-700 line-clamp-1">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-500">{book.author || '未知作者'}</p>
                <div className="mt-2 flex gap-1">
                  {book.level && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded">{book.level}</span>
                  )}
                  {book.word_count && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded">{book.word_count}词</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
