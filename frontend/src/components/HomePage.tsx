import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, BookOpen, CheckCircle, Clock, BookMarked, Plus } from 'lucide-react';
import { booksAPI } from '../services/api';
import { progressStorage } from '../services/storage';
import type { Book } from '../types';

type LexileFilter = 'all' | '0-100' | '100-200' | '200-400' | '300-500' | '500-700' | '650-850' | '750-950' | '850-1050' | '1000+';

interface HomePageProps {
  isLoggedIn: boolean;
}

export default function HomePage({ isLoggedIn }: HomePageProps) {
  const navigate = useNavigate();
  const [lexileFilter, setLexileFilter] = useState<LexileFilter>('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentBook, setRecentBook] = useState<Book | null>(null);

  useEffect(() => {
    loadBooks();
    loadRecentBook();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks();
      setBooks(response.data);
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentBook = () => {
    // 获取最近阅读的书籍ID（从本地存储）
    const allProgress = progressStorage.getAll();
    const bookIds = Object.keys(allProgress);

    if (bookIds.length > 0) {
      // 获取最近阅读的书籍信息
      const recentBookId = bookIds[0]; // 这里简单取第一个，实际应该按时间排序
      booksAPI.getBook(recentBookId).then(response => {
        setRecentBook(response.data);
      }).catch(err => {
        console.error('Failed to load recent book:', err);
      });
    }
  };

  const handleBookClick = (book: Book) => {
    navigate(`/book/${book.id}?from=home`);
  };

  // 筛选书籍（只使用蓝思值筛选）
  const getFilteredBooks = () => {
    if (lexileFilter === 'all') return books;

    return books.filter(book => {
      if (!book.lexile) return false;

      // 提取数字部分
      const lexileValue = parseInt(book.lexile.replace(/[^\d]/g, ''));

      switch (lexileFilter) {
        case '0-100':
          return lexileValue >= 0 && lexileValue <= 100;
        case '100-200':
          return lexileValue > 100 && lexileValue <= 200;
        case '200-400':
          return lexileValue > 200 && lexileValue <= 400;
        case '300-500':
          return lexileValue > 300 && lexileValue <= 500;
        case '500-700':
          return lexileValue > 500 && lexileValue <= 700;
        case '650-850':
          return lexileValue > 650 && lexileValue <= 850;
        case '750-950':
          return lexileValue > 750 && lexileValue <= 950;
        case '850-1050':
          return lexileValue > 850 && lexileValue <= 1050;
        case '1000+':
          return lexileValue >= 1000;
        default:
          return true;
      }
    });
  };

  const filteredBooks = getFilteredBooks();

  return (
    <main className="flex-grow flex flex-col">
      <header className="flex flex-col justify-center items-center text-center px-4 py-16">
        <div className="max-w-4xl mb-10">
          <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-tight mb-6">
            "Language is not taught, <br />
            <span className="text-teal-700 italic">it is acquired.</span>"
          </h1>
          <div className="flex items-center justify-center gap-3 text-gray-500">
            <span className="w-8 h-px bg-gray-400"></span>
            <p className="text-base tracking-wider uppercase font-medium">Stephen Krashen</p>
            <span className="w-8 h-px bg-gray-400"></span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          <button
            onClick={() => navigate('/learning-theory')}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:border-teal-600 hover:text-teal-600 transition-all text-sm"
          >
            <Lightbulb className="inline w-4 h-4 mr-2" />
            学习原理
          </button>
          <button
            className="px-8 py-2.5 rounded-lg bg-teal-700 text-white shadow-lg hover:bg-teal-800 hover:-translate-y-0.5 transition-all text-base font-medium"
            onClick={() => navigate(isLoggedIn ? '/my-shelf' : '/shelf')}
          >
            <BookOpen className="inline w-5 h-5 mr-2" />
            {isLoggedIn ? '继续阅读' : '开始阅读'}
          </button>
          <button
            onClick={() => navigate('/vocab-test')}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:border-teal-600 hover:text-teal-600 transition-all text-sm"
          >
            <CheckCircle className="inline w-4 h-4 mr-2" />
            词汇检测
          </button>
        </div>
      </header>

      {isLoggedIn && (
        <section className="w-full max-w-6xl mx-auto px-6 mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="text-teal-600 w-5 h-5" />
              <h2 className="text-lg font-bold text-gray-800">继续阅读</h2>
            </div>
            <button
              onClick={() => navigate('/my-shelf')}
              className="text-sm text-teal-700 hover:underline"
            >
              查看全部
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 第一本书 */}
            {recentBook && (
              <div
                className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer flex gap-4"
                onClick={() => handleBookClick(recentBook)}
              >
                {/* 左侧封面 */}
                <div className="w-20 h-28 bg-blue-100 rounded-md flex items-center justify-center text-blue-400 flex-shrink-0 overflow-hidden relative">
                  {recentBook.cover ? (
                    <>
                      <img
                        src={recentBook.cover}
                        alt={recentBook.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const imgElement = e.target as HTMLImageElement;
                          imgElement.style.display = 'none';
                          const fallbackIcon = imgElement.parentElement?.querySelector('.fallback-icon');
                          if (fallbackIcon) {
                            fallbackIcon.classList.remove('hidden');
                          }
                        }}
                      />
                      <BookOpen className="fallback-icon hidden w-10 h-10 absolute" />
                    </>
                  ) : (
                    <BookOpen className="w-10 h-10" />
                  )}
                  {/* 蓝思值彩条，缺失时显示默认值 */}
                  <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
                    <div className="absolute top-2 right-[-14px] w-16 bg-blue-600 text-white text-[10px] font-bold py-0.5 text-center transform rotate-45 shadow-md">
                      {recentBook.lexile || '***L'}
                    </div>
                  </div>
                </div>
                {/* 右侧信息 */}
                <div className="flex flex-col justify-between w-full">
                  <div>
                    <h3 className="font-bold text-gray-800 font-serif text-lg">{recentBook.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{recentBook.author || '未知作者'}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>进度</span>
                      <span>45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 第二本书 */}
            {books.length > 1 && (
              <div
                className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer flex gap-4"
                onClick={() => handleBookClick(books[1])}
              >
                {/* 左侧封面 */}
                <div className="w-20 h-28 bg-amber-100 rounded-md flex items-center justify-center text-amber-400 flex-shrink-0 overflow-hidden relative">
                  {books[1].cover ? (
                    <>
                      <img
                        src={books[1].cover}
                        alt={books[1].title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const imgElement = e.target as HTMLImageElement;
                          imgElement.style.display = 'none';
                          const fallbackIcon = imgElement.parentElement?.querySelector('.fallback-icon');
                          if (fallbackIcon) {
                            fallbackIcon.classList.remove('hidden');
                          }
                        }}
                      />
                      <BookOpen className="fallback-icon hidden w-10 h-10 absolute" />
                    </>
                  ) : (
                    <BookOpen className="w-10 h-10" />
                  )}
                  {/* 蓝思值彩条，缺失时显示默认值 */}
                  <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
                    <div className="absolute top-2 right-[-14px] w-16 bg-blue-600 text-white text-[10px] font-bold py-0.5 text-center transform rotate-45 shadow-md">
                      {books[1].lexile || '***L'}
                    </div>
                  </div>
                </div>
                {/* 右侧信息 */}
                <div className="flex flex-col justify-between w-full">
                  <div>
                    <h3 className="font-bold text-gray-800 font-serif text-lg">{books[1].title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{books[1].author || '未知作者'}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>进度</span>
                      <span>12%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 添加新书卡片 */}
            <div
              className="bg-white p-5 rounded-xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-teal-500 hover:text-teal-600 transition-colors cursor-pointer min-h-[140px]"
              onClick={() => navigate('/upload')}
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="text-sm">从书架添加新书</span>
            </div>
          </div>
        </section>
      )}

      <section className="w-full max-w-6xl mx-auto px-6 pb-20 flex-grow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookMarked className="text-amber-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-800">书架资源</h2>
          </div>
          <span className="text-sm text-gray-500">依据蓝思值进行分类</span>
        </div>

        {/* 蓝思值筛选按钮 */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setLexileFilter('all')}
            className={`text-sm font-medium transition-colors ${
              lexileFilter === 'all' ? 'text-teal-700 underline' : 'text-gray-600 hover:text-teal-700 hover:underline'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setLexileFilter('0-100')}
            className={`text-sm font-medium transition-colors ${
              lexileFilter === '0-100' ? 'text-teal-700 underline' : 'text-gray-600 hover:text-teal-700 hover:underline'
            }`}
          >
            0-100L
          </button>
          <button
            onClick={() => setLexileFilter('100-200')}
            className={`text-sm font-medium transition-colors ${
              lexileFilter === '100-200' ? 'text-teal-700 underline' : 'text-gray-600 hover:text-teal-700 hover:underline'
            }`}
          >
            100-200L
          </button>
          <button
            onClick={() => setLexileFilter('200-400')}
            className={`text-sm font-medium transition-colors ${
              lexileFilter === '200-400' ? 'text-teal-700 underline' : 'text-gray-600 hover:text-teal-700 hover:underline'
            }`}
          >
            200-400L
          </button>
          <button
            onClick={() => setLexileFilter('300-500')}
            className={`text-sm font-medium transition-colors ${
              lexileFilter === '300-500' ? 'text-teal-700 underline' : 'text-gray-600 hover:text-teal-700 hover:underline'
            }`}
          >
            300-500L
          </button>
          <button
            onClick={() => setLexileFilter('500-700')}
            className={`text-sm font-medium transition-colors ${
              lexileFilter === '500-700' ? 'text-teal-700 underline' : 'text-gray-600 hover:text-teal-700 hover:underline'
            }`}
          >
            500-700L
          </button>
          <button
            onClick={() => setLexileFilter('1000+')}
            className={`text-sm font-medium transition-colors ${
              lexileFilter === '1000+' ? 'text-teal-700 underline' : 'text-gray-600 hover:text-teal-700 hover:underline'
            }`}
          >
            1000L+
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-10 text-gray-500">加载中...</div>
          ) : filteredBooks.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500">暂无书籍</div>
          ) : (
            <>
              {filteredBooks.slice(0, 10).map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  color={['teal', 'blue', 'purple', 'green', 'pink', 'indigo'][index % 6]}
                  onClick={() => handleBookClick(book)}
                />
              ))}
              {filteredBooks.length > 10 && (
                <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 flex justify-end mt-4">
                  <button
                    onClick={() => navigate('/shelf')}
                    className="text-sm text-teal-700 hover:underline font-medium"
                  >
                    查看全部 →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

interface BookCardProps {
  book: Book;
  color: string;
  onClick: () => void;
}

function BookCard({ book, color, onClick }: BookCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; badge: string }> = {
    teal: { bg: 'bg-teal-100', text: 'text-teal-200', badge: 'bg-amber-100 text-amber-800' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-200', badge: 'bg-amber-100 text-amber-800' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-200', badge: 'bg-amber-100 text-amber-800' },
    green: { bg: 'bg-green-100', text: 'text-green-200', badge: 'bg-amber-100 text-amber-800' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-200', badge: 'bg-amber-100 text-amber-800' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-200', badge: 'bg-amber-100 text-amber-800' },
  };

  const colors = colorClasses[color] || colorClasses.teal;
  const lexileTag = book.lexile || '***L'; // 蓝思值缺失时统一显示占位符

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div
        className={`aspect-[2/3] ${colors.bg} border border-gray-200 rounded-lg shadow-sm mb-3 flex items-center justify-center relative overflow-hidden group-hover:shadow-md transition-all group-hover:-translate-y-1`}
      >
        {book.cover ? (
          <>
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const imgElement = e.target as HTMLImageElement;
                imgElement.style.display = 'none';
                const fallbackIcon = imgElement.parentElement?.querySelector('.fallback-icon');
                if (fallbackIcon) {
                  fallbackIcon.classList.remove('hidden');
                }
              }}
            />
            <BookOpen className={`fallback-icon hidden w-12 h-12 ${colors.text} absolute`} />
          </>
        ) : (
          <BookOpen className={`w-12 h-12 ${colors.text}`} />
        )}
        {/* 蓝思值彩条 */}
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-3 right-[-20px] w-24 bg-blue-600 text-white text-[10px] font-bold py-1 text-center transform rotate-45 shadow-md">
            {lexileTag}
          </div>
        </div>
      </div>
      <h3 className="text-sm font-bold text-gray-800 group-hover:text-teal-700 line-clamp-1">{book.title}</h3>
      <p className="text-xs text-gray-500">{book.author || '未知作者'}</p>
    </div>
  );
}
