import { useState, useEffect } from 'react';
import { Lightbulb, BookOpen, CheckCircle, Clock, BookMarked } from 'lucide-react';
import { booksAPI } from '../services/api';
import { progressStorage } from '../services/storage';
import { useAppStore } from '../stores/useAppStore';
import type { Book } from '../types';

type Page = 'home' | 'shelf' | 'vocab' | 'reader';
type FilterMode = 'cn' | 'us' | 'lexile';

interface HomePageProps {
  isLoggedIn: boolean;
  onNavigate: (page: Page) => void;
}

export default function HomePage({ isLoggedIn, onNavigate }: HomePageProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('cn');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentBook, setRecentBook] = useState<Book | null>(null);
  const setCurrentBook = useAppStore(state => state.setCurrentBook);

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
    setCurrentBook(book);
    onNavigate('reader');
  };

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
          <button className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:border-teal-600 hover:text-teal-600 transition-all text-sm">
            <Lightbulb className="inline w-4 h-4 mr-2" />
            学习原理
          </button>
          <button
            className="px-8 py-2.5 rounded-lg bg-teal-700 text-white shadow-lg hover:bg-teal-800 hover:-translate-y-0.5 transition-all text-base font-medium"
            onClick={() => onNavigate('reader')}
          >
            <BookOpen className="inline w-5 h-5 mr-2" />
            开始阅读
          </button>
          <button className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:border-teal-600 hover:text-teal-600 transition-all text-sm">
            <CheckCircle className="inline w-4 h-4 mr-2" />
            词汇检测
          </button>
        </div>
      </header>

      {isLoggedIn && recentBook && (
        <section className="w-full max-w-6xl mx-auto px-6 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-teal-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-800">最近阅读</h2>
          </div>
          <div
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex gap-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleBookClick(recentBook)}
          >
            <div className="w-24 h-32 bg-indigo-100 rounded flex-shrink-0 flex items-center justify-center text-indigo-300 overflow-hidden">
              {recentBook.cover ? (
                <img src={recentBook.cover} alt={recentBook.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-12 h-12" />
              )}
            </div>
            <div className="flex flex-col justify-center flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  {recentBook.level && (
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {recentBook.level}
                    </span>
                  )}
                  <h3 className="font-serif text-xl font-bold text-gray-800 mt-1">{recentBook.title}</h3>
                  <p className="text-sm text-gray-500">{recentBook.author || '未知作者'}</p>
                </div>
                <button className="text-sm text-teal-700 hover:underline">继续阅读 &rarr;</button>
              </div>
              {/* 进度条暂时使用模拟数据 */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>阅读进度</span>
                  <span>35%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
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

          <div className="bg-gray-200 p-1 rounded-lg flex text-sm font-medium">
            <button
              onClick={() => setFilterMode('cn')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                filterMode === 'cn' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              中国年级
            </button>
            <button
              onClick={() => setFilterMode('us')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                filterMode === 'us' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              美国年级
            </button>
            <button
              onClick={() => setFilterMode('lexile')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                filterMode === 'lexile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              蓝思值
            </button>
          </div>
        </div>

        {filterMode === 'cn' && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button className="px-4 py-1.5 rounded-full bg-teal-600 text-white text-sm shadow-sm">全部</button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-600 text-gray-600 text-sm transition-colors">
              小学 1-3 年级
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-600 text-gray-600 text-sm transition-colors">
              小学 4-6 年级
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-600 text-gray-600 text-sm transition-colors">
              初中 1 年级
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-600 text-gray-600 text-sm transition-colors">
              初中 2 年级
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-600 text-gray-600 text-sm transition-colors">
              初中 3 年级
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-600 text-gray-600 text-sm transition-colors">
              高中 1 年级
            </button>
          </div>
        )}

        {filterMode === 'us' && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button className="px-4 py-1.5 rounded-full bg-teal-600 text-white text-sm shadow-sm">All</button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm">
              Pre-K
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm">
              1st Grade
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm">
              2nd Grade
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm">
              3rd Grade
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm">
              4th Grade
            </button>
          </div>
        )}

        {filterMode === 'lexile' && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button className="px-4 py-1.5 rounded-full bg-teal-600 text-white text-sm shadow-sm">All</button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm">
              BR - 100L
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm">
              200L - 400L
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm">
              500L - 700L
            </button>
            <button className="px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm">
              1000L+
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-10 text-gray-500">加载中...</div>
          ) : books.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500">暂无书籍</div>
          ) : (
            books.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                color={['teal', 'blue', 'purple', 'green', 'pink', 'indigo'][index % 6]}
                onClick={() => handleBookClick(book)}
              />
            ))
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

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div
        className={`aspect-[2/3] ${colors.bg} border border-gray-200 rounded-lg shadow-sm mb-3 flex items-center justify-center relative overflow-hidden group-hover:shadow-md transition-all group-hover:-translate-y-1`}
      >
        {book.cover ? (
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen className={`w-12 h-12 ${colors.text}`} />
        )}
        {book.level && (
          <div className={`absolute top-2 right-2 ${colors.badge} text-[10px] font-bold px-1.5 py-0.5 rounded`}>
            {book.level}
          </div>
        )}
      </div>
      <h3 className="text-sm font-bold text-gray-800 group-hover:text-teal-700 line-clamp-1">{book.title}</h3>
      <p className="text-xs text-gray-500">{book.author || '未知作者'}</p>
    </div>
  );
}
