import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import type { Book } from '../types';
import { LEVELS } from '../types';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadBooks();
  }, [selectedLevel, searchQuery]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedLevel) params.level = selectedLevel;
      if (searchQuery) params.search = searchQuery;

      console.log('Fetching books with params:', params);
      const response = await booksAPI.getBooks(params);
      console.log('Books response:', response.data);
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">英语分级阅读</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="搜索书名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Level filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLevel('')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedLevel === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              全部
            </button>
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedLevel === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">暂无书籍</p>
            <p className="text-gray-400 mt-2">
              {selectedLevel ? `"${selectedLevel}" 等级暂无书籍` : '请使用后端脚本导入 EPUB 书籍'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                onClick={() => navigate(`/books/${book.id}`)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
              >
                {/* Cover */}
                <div className="aspect-[2/3] bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-white text-center p-6">
                      <div className="text-2xl font-bold mb-2">{book.title}</div>
                      <div className="text-sm opacity-90">{book.author}</div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate">{book.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{book.author}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {book.level && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {book.level}
                      </span>
                    )}
                    <span>{book.word_count.toLocaleString()} 词</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
