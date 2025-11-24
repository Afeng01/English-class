import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import type { Book } from '../types';
import { progressStorage } from '../services/storage';
import { Navigation, Button, Card, Hero } from '../components';
import { useAppStore } from '../stores/useAppStore';

export default function HomePage() {
  const navigate = useNavigate();
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { vocabulary } = useAppStore();

  useEffect(() => {
    loadRecentBooks();
  }, []);

  const loadRecentBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks();
      const allBooks = response.data;

      const progress = progressStorage.getAll();
      const progressList = Object.values(progress);

      const sorted = progressList
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 4)
        .map((p) => allBooks.find((b) => b.id === p.book_id))
        .filter(Boolean) as Book[];

      setRecentBooks(sorted);
    } catch (error) {
      console.error('Failed to load recent books:', error);
    } finally {
      setLoading(false);
    }
  };

  // 统计数据
  const stats = {
    level: '小学三年级',
    booksRead: Object.keys(progressStorage.getAll()).length,
    vocabularyCount: vocabulary.length,
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      {/* 导航栏 */}
      <Navigation
        links={[
          { label: '书库', path: '/books' },
          { label: '词库', path: '/vocabulary' },
          { label: '个人中心', path: '/profile' },
        ]}
      />

      {/* Hero 区域 - 苹果式巨大标题 */}
      <Hero
        background="gradient"
        size="lg"
        title={
          <>
            通过阅读原著
            <br />
            <span className="gradient-text">提升英语能力</span>
          </>
        }
        subtitle="分级书籍 · 沉浸式阅读 · 即时查词 · 词汇积累"
        cta={
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/books')}
            className="text-lg px-10 py-5"
          >
            开始阅读
          </Button>
        }
      />

      {/* 统计数据 - 苹果式卡片网格 */}
      <section className="py-20 px-6 bg-white">
        <div className="container-section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card
              variant="elevated"
              elevation="md"
              hoverable
              className="text-center group py-8"
            >
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold">
                  当前等级
                </div>
                <div className="text-5xl font-black text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-110">
                  {stats.level}
                </div>
              </div>
            </Card>

            <Card
              variant="elevated"
              elevation="md"
              hoverable
              className="text-center group py-8"
            >
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold">
                  已读书籍
                </div>
                <div className="text-5xl font-black text-[var(--color-accent)] transition-transform duration-300 group-hover:scale-110">
                  {stats.booksRead}
                </div>
              </div>
            </Card>

            <Card
              variant="elevated"
              elevation="md"
              hoverable
              className="text-center group py-8"
            >
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold">
                  掌握词汇
                </div>
                <div className="text-5xl font-black text-[var(--color-success)] transition-transform duration-300 group-hover:scale-110">
                  {stats.vocabularyCount}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 正在阅读 */}
      {recentBooks.length > 0 && (
        <section className="py-20 px-6 bg-[var(--color-bg-subtle)]">
          <div className="container-section">
            <h2 className="text-[length:var(--text-display)] font-bold mb-12 text-[var(--color-text)]">
              正在阅读
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentBooks.map((book, index) => {
                  const progress = progressStorage.get(book.id);
                  const percentage = progress
                    ? Math.round((progress.current_chapter / ((book as any).chapters?.length || 1)) * 100)
                    : 0;

                  return (
                    <Card
                      key={book.id}
                      padding="none"
                      hoverable
                      elevation="md"
                      onClick={() => navigate(`/books/${book.id}`)}
                      className={`reveal reveal-delay-${Math.min(index + 1, 5)}`}
                    >
                      {/* 封面 */}
                      <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden relative">
                        {book.cover ? (
                          <img
                            src={book.cover}
                            alt={book.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-6 text-center">
                            <div>
                              <div className="text-lg font-bold text-[var(--color-text)] mb-2">
                                {book.title}
                              </div>
                              <div className="text-sm text-[var(--color-text-secondary)]">
                                {book.author}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 阅读进度徽章 */}
                        {percentage > 0 && (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-[var(--color-primary)]">
                            {percentage}%
                          </div>
                        )}
                      </div>

                      {/* 信息 */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg truncate text-[var(--color-text)]">
                            {book.title}
                          </h3>
                          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                            {book.author}
                          </p>
                        </div>

                        {/* 进度条 - 苹果式渐变 */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
                            <span>阅读进度</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--color-bg-muted)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-700 ease-[var(--ease-out)]"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 特性介绍 - 苹果式图标网格 */}
      <section className="py-24 px-6 bg-white">
        <div className="container-section">
          <h2 className="text-[length:var(--text-display)] font-bold text-center mb-4 text-[var(--color-text)]">
            为什么选择我们
          </h2>
          <p className="text-center text-[var(--color-text-secondary)] text-lg mb-16 max-w-2xl mx-auto">
            基于科学的语言学习方法，打造沉浸式的英语阅读体验
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {/* 特性 1 */}
            <div className="text-center space-y-4 reveal">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl flex items-center justify-center text-5xl transform transition-transform hover:scale-110 duration-300">
                📚
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-text)]">科学分级</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                根据英语难度智能分级，从学前到高中，循序渐进提升阅读能力
              </p>
            </div>

            {/* 特性 2 */}
            <div className="text-center space-y-4 reveal reveal-delay-1">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-3xl flex items-center justify-center text-5xl transform transition-transform hover:scale-110 duration-300">
                🔍
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-text)]">即时查词</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                点击单词即可查看释义、发音，无需打断阅读流程，保持沉浸体验
              </p>
            </div>

            {/* 特性 3 */}
            <div className="text-center space-y-4 reveal reveal-delay-2">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl flex items-center justify-center text-5xl transform transition-transform hover:scale-110 duration-300">
                📝
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-text)]">词汇积累</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                自动保存生词到个人词库，智能复习提醒，让记忆更牢固持久
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - 极简风格 */}
      <footer className="py-12 px-6 text-center bg-[var(--color-bg-subtle)] border-t border-[var(--color-border-subtle)]">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          © 2025 英语分级阅读. 让阅读成为习惯.
        </p>
      </footer>
    </div>
  );
}
