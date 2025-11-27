import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Upload, Library } from 'lucide-react';
import { booksAPI } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';
import type { Book } from '../types';

type LexileRange = 'all' | '0-200' | '200-400' | '400-600' | '600-800' | '800-1000' | '1000+';

export default function ShelfPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fiction' | 'non-fiction'>('all');
  const [selectedLexileRanges, setSelectedLexileRanges] = useState<Set<LexileRange>>(new Set(['all']));
  const [selectedSeries, setSelectedSeries] = useState<'all' | 'magic-tree'>('all');

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
    navigate(`/book/${book.id}?from=shelf`);
  };

  // 切换难度筛选
  const toggleLexileRange = (range: LexileRange) => {
    const newRanges = new Set(selectedLexileRanges);

    if (range === 'all') {
      setSelectedLexileRanges(new Set(['all']));
    } else {
      newRanges.delete('all');
      if (newRanges.has(range)) {
        newRanges.delete(range);
      } else {
        newRanges.add(range);
      }

      if (newRanges.size === 0) {
        newRanges.add('all');
      }

      setSelectedLexileRanges(newRanges);
    }
  };

  // 筛选书籍
  const getFilteredBooks = () => {
    return books.filter(book => {
      // 搜索筛选
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = book.title.toLowerCase().includes(query);
        const matchAuthor = book.author?.toLowerCase().includes(query);
        if (!matchTitle && !matchAuthor) return false;
      }

      // 分类筛选
      if (selectedCategory !== 'all') {
        if (book.category !== selectedCategory) return false;
      }

      // 难度筛选（基于蓝思值）
      if (!selectedLexileRanges.has('all')) {
        if (!book.lexile) return false;

        const lexileValue = parseInt(book.lexile.replace(/[^\d]/g, ''));
        let matchesRange = false;

        for (const range of selectedLexileRanges) {
          switch (range) {
            case '0-200':
              if (lexileValue >= 0 && lexileValue <= 200) matchesRange = true;
              break;
            case '200-400':
              if (lexileValue > 200 && lexileValue <= 400) matchesRange = true;
              break;
            case '400-600':
              if (lexileValue > 400 && lexileValue <= 600) matchesRange = true;
              break;
            case '600-800':
              if (lexileValue > 600 && lexileValue <= 800) matchesRange = true;
              break;
            case '800-1000':
              if (lexileValue > 800 && lexileValue <= 1000) matchesRange = true;
              break;
            case '1000+':
              if (lexileValue > 1000) matchesRange = true;
              break;
          }
        }

        if (!matchesRange) return false;
      }

      // 系列筛选
      if (selectedSeries !== 'all') {
        if (selectedSeries === 'magic-tree') {
          if (!book.series || !book.series.toLowerCase().includes('magic tree')) return false;
        }
      }

      return true;
    });
  };

  const filteredBooks = getFilteredBooks();

  // 统计各分类书籍数量
  const fictionCount = books.filter(b => b.category === 'fiction').length;
  const nonFictionCount = books.filter(b => b.category === 'non-fiction').length;

  const handleMyShelfClick = () => {
    if (user) {
      navigate('/my-shelf');
    } else {
      setShowLoginPrompt(true);
    }
  };

  return (
    <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-10">
      {/* 登录提示弹窗 */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">需要登录</h3>
            <p className="text-gray-600 mb-4">请先登录以访问您的个人书架</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
              >
                去登录
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">全部图书</h2>
        <div className="flex gap-3">
          <button
            onClick={handleMyShelfClick}
            className="flex items-center gap-1 text-sm text-teal-700 hover:underline transition-colors"
          >
            <Library className="w-4 h-4" />
            <span>个人书架</span>
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

      <div className="flex gap-6">
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm sticky top-24">
            <h3 className="font-bold text-gray-700 mb-4">分类</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center justify-between cursor-pointer hover:text-teal-700 ${
                  selectedCategory === 'all' ? 'font-medium text-teal-700' : ''
                }`}
              >
                <span>全部</span>
                <span className={`px-1.5 rounded text-xs ${
                  selectedCategory === 'all' ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {books.length}
                </span>
              </li>
              <li
                onClick={() => setSelectedCategory('fiction')}
                className={`flex items-center justify-between cursor-pointer hover:text-teal-700 ${
                  selectedCategory === 'fiction' ? 'font-medium text-teal-700' : ''
                }`}
              >
                <span>虚构类 (Fiction)</span>
                <span className={`px-1.5 rounded text-xs ${
                  selectedCategory === 'fiction' ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {fictionCount}
                </span>
              </li>
              <li
                onClick={() => setSelectedCategory('non-fiction')}
                className={`flex items-center justify-between cursor-pointer hover:text-teal-700 ${
                  selectedCategory === 'non-fiction' ? 'font-medium text-teal-700' : ''
                }`}
              >
                <span>非虚构类 (Non-fiction)</span>
                <span className={`px-1.5 rounded text-xs ${
                  selectedCategory === 'non-fiction' ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {nonFictionCount}
                </span>
              </li>
            </ul>

            <div className="w-full h-px bg-gray-100 my-4"></div>
            <h3 className="font-bold text-gray-700 mb-4">难度（蓝思值）</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-teal-600 focus:ring-teal-500"
                  checked={selectedLexileRanges.has('all')}
                  onChange={() => toggleLexileRange('all')}
                />
                全部
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-teal-600 focus:ring-teal-500"
                  checked={selectedLexileRanges.has('0-200')}
                  onChange={() => toggleLexileRange('0-200')}
                />
                0-200L
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-teal-600 focus:ring-teal-500"
                  checked={selectedLexileRanges.has('200-400')}
                  onChange={() => toggleLexileRange('200-400')}
                />
                200-400L
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-teal-600 focus:ring-teal-500"
                  checked={selectedLexileRanges.has('400-600')}
                  onChange={() => toggleLexileRange('400-600')}
                />
                400-600L
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-teal-600 focus:ring-teal-500"
                  checked={selectedLexileRanges.has('600-800')}
                  onChange={() => toggleLexileRange('600-800')}
                />
                600-800L
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-teal-600 focus:ring-teal-500"
                  checked={selectedLexileRanges.has('800-1000')}
                  onChange={() => toggleLexileRange('800-1000')}
                />
                800-1000L
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-teal-600 focus:ring-teal-500"
                  checked={selectedLexileRanges.has('1000+')}
                  onChange={() => toggleLexileRange('1000+')}
                />
                1000L+
              </label>
            </div>

            <div className="w-full h-px bg-gray-100 my-4"></div>
            <h3 className="font-bold text-gray-700 mb-4">系列</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li
                onClick={() => setSelectedSeries('all')}
                className={`cursor-pointer hover:text-teal-700 ${
                  selectedSeries === 'all' ? 'font-medium text-teal-700' : ''
                }`}
              >
                全部
              </li>
              <li
                onClick={() => setSelectedSeries('magic-tree')}
                className={`cursor-pointer hover:text-teal-700 ${
                  selectedSeries === 'magic-tree' ? 'font-medium text-teal-700' : ''
                }`}
              >
                Magic Tree House
              </li>
            </ul>
          </div>
        </aside>

        <div className="flex-grow">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索书名、作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>

          {!loading && !error && (
            <div className="mb-4 text-sm text-gray-600">
              共找到 <span className="font-bold text-teal-700">{filteredBooks.length}</span> 本书籍
            </div>
          )}

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

            {!loading && !error && filteredBooks.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                未找到匹配的书籍
              </div>
            )}

            {!loading && !error && filteredBooks.map((book) => (
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
                  {book.lexile && (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-3 right-[-20px] w-24 bg-blue-500 text-white text-[10px] font-bold py-1 text-center transform rotate-45 shadow-md">
                        {book.lexile}
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-teal-700 line-clamp-1">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-500">{book.author || '未知作者'}</p>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {book.level && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{book.level}</span>
                  )}
                  {book.lexile && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{book.lexile}</span>
                  )}
                  {book.word_count && (
                    <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                      {(book.word_count / 1000).toFixed(1)}k词
                    </span>
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
