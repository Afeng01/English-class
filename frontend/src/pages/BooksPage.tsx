import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import type { Book } from '../types';
import { LEVELS } from '../types';
import { Navigation, Card, Button } from '../components';

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

  // 生成书籍封面占位色（基于书名hash）
  const getGradientColor = (title: string) => {
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      'from-blue-400 to-indigo-500',
      'from-purple-400 to-pink-500',
      'from-green-400 to-teal-500',
      'from-orange-400 to-red-500',
      'from-cyan-400 to-blue-500',
      'from-pink-400 to-rose-500',
    ];
    return gradients[hash % gradients.length];
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      {/* 导航栏 */}
      <Navigation
        links={[
          { label: '首页', path: '/' },
          { label: '词库', path: '/vocabulary' },
          { label: '个人中心', path: '/profile' },
        ]}
      />

      {/* Hero Header */}
      <section className="py-20 px-6 bg-white border-b border-[var(--color-border-subtle)]">
        <div className="container-wide">
          <h1 className="text-[length:var(--text-display)] font-black text-[var(--color-text)] mb-6">
            图书馆
          </h1>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
            精心挑选的英语原著，科学分级，循序渐进提升阅读能力
          </p>
        </div>
      </section>

      <div className="container-wide py-16 px-6">
        {/* 搜索和筛选 */}
        <div className="mb-10 space-y-6">
          {/* 搜索框 - 苹果式设计 */}
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-[var(--color-text-tertiary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="搜索书名或作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-12 pr-4 py-4
                bg-white
                border-2 border-[var(--color-border)]
                rounded-2xl
                text-[var(--color-text)]
                text-lg
                placeholder:text-[var(--color-text-tertiary)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]
                focus:shadow-lg
                transition-all duration-[var(--duration-fast)]
              "
            />
          </div>

          {/* 等级筛选 - Pill 按钮 */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedLevel === '' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedLevel('')}
              className="rounded-full"
            >
              全部
            </Button>
            {LEVELS.map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedLevel(level)}
                className="rounded-full"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* 书籍网格 */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24">
            <div className="w-12 h-12 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-6 text-[var(--color-text-secondary)] text-lg">加载中...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">📚</div>
            <p className="text-[var(--color-text)] text-2xl font-semibold mb-3">
              {selectedLevel ? `暂无"${selectedLevel}"级别书籍` : '暂无书籍'}
            </p>
            <p className="text-[var(--color-text-secondary)]">
              {selectedLevel ? '试试选择其他等级' : '请使用后端脚本导入 EPUB 书籍'}
            </p>
          </div>
        ) : (
          <>
            {/* 结果统计 */}
            <div className="mb-8 text-sm text-[var(--color-text-secondary)]">
              找到 <span className="font-semibold text-[var(--color-text)]">{books.length}</span> 本书籍
            </div>

            {/* 响应式网格 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {books.map((book, index) => (
                <Card
                  key={book.id}
                  padding="none"
                  hoverable
                  elevation="md"
                  onClick={() => navigate(`/books/${book.id}`)}
                  className={`group reveal reveal-delay-${Math.min((index % 5) + 1, 5)}`}
                >
                  {/* 封面 */}
                  <div className={`aspect-[2/3] bg-gradient-to-br ${getGradientColor(book.title)} overflow-hidden relative`}>
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-center text-white">
                        <div>
                          <div className="text-base font-bold mb-1 line-clamp-3">
                            {book.title}
                          </div>
                          <div className="text-xs opacity-90">
                            {book.author}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 等级徽章 */}
                    {book.level && (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-[var(--color-primary)]">
                        {book.level}
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-base text-[var(--color-text)] line-clamp-2 leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {book.author}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] pt-1">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {book.word_count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
