import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Upload, Library, Play, Eye, Trash2 } from 'lucide-react';
import { booksAPI } from '../services/api';
import { myShelfStorage } from '../services/storage';
import type { Book } from '../types';

export default function MyShelfPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyShelfBooks();
  }, []);

  const loadMyShelfBooks = async () => {
    try {
      setLoading(true);
      const bookIds = myShelfStorage.getAll();

      if (bookIds.length === 0) {
        setBooks([]);
        setLoading(false);
        return;
      }

      // 获取所有书籍详情
      const bookPromises = bookIds.map(id => booksAPI.getBook(id));
      const responses = await Promise.allSettled(bookPromises);

      const loadedBooks = responses
        .filter((result): result is PromiseFulfilledResult<{ data: Book }> => result.status === 'fulfilled')
        .map(result => result.value.data);

      setBooks(loadedBooks);
    } catch (err) {
      console.error('Failed to load my shelf books:', err);
      setError('无法加载书架书籍');
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (book: Book) => {
    navigate(`/book/${book.id}?from=my-shelf`);
  };

  const handleRemoveBook = async (bookId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    myShelfStorage.remove(bookId);
    // 重新加载书架
    await loadMyShelfBooks();
  };

  const handleReadBook = (bookId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/reader?bookId=${bookId}&from=my-shelf`);
  };

  return (
    <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">我的书架</h2>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/shelf')}
            className="flex items-center gap-1 text-sm text-teal-700 hover:underline transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>全部图书</span>
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-1 text-sm text-teal-700 hover:underline transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>上传书籍</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">加载中...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Library className="w-12 h-12 text-gray-300" />
          </div>
          <p className="text-gray-500 mb-4">书架空空如也</p>
          <button
            onClick={() => navigate('/shelf')}
            className="px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
          >
            去全部书籍添加
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onView={() => handleBookClick(book)}
              onRead={(e) => handleReadBook(book.id, e)}
              onRemove={(e) => handleRemoveBook(book.id, e)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

interface BookCardProps {
  book: Book;
  onView: () => void;
  onRead: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

function BookCard({ book, onView, onRead, onRemove }: BookCardProps) {
  const [showActions, setShowActions] = useState(false);
  const difficultyTag = book.lexile || '***L'; // 蓝思值缺失时统一显示占位符

  return (
    <div
      className="group cursor-pointer relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className="aspect-[2/3] bg-white border border-gray-200 rounded-lg shadow-sm mb-3 flex items-center justify-center relative overflow-hidden group-hover:shadow-lg transition-all"
        onClick={onView}
      >
        {book.cover ? (
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="w-12 h-12 text-gray-200" />
        )}

        {/* 悬停时显示的操作按钮 */}
        {showActions && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 p-4 animate-fade-in">
            <button
              onClick={onRead}
              className="w-full py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Play className="w-4 h-4" />
              <span>阅读</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="w-full py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              <span>详情</span>
            </button>
            <button
              onClick={onRemove}
              className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>删除</span>
            </button>
          </div>
        )}

        {/* 蓝思值彩条 */}
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-3 right-[-20px] w-24 bg-blue-600 text-white text-[10px] font-bold py-1 text-center transform rotate-45 shadow-md">
            {difficultyTag}
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-800 group-hover:text-teal-700 line-clamp-1">
        {book.title}
      </h3>
      <p className="text-xs text-gray-500 mb-1">{book.author || '未知作者'}</p>
      <div className="flex gap-1 flex-wrap">
        {/* 列表标签中同步展示蓝思值 */}
        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
          {difficultyTag}
        </span>
        {book.word_count && (
          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {(book.word_count / 1000).toFixed(1)}k词
          </span>
        )}
      </div>
    </div>
  );
}
