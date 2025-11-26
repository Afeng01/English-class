import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, List, BookMarked, TrendingUp, Play } from 'lucide-react';
import { booksAPI } from '../services/api';
import { progressStorage } from '../services/storage';
import { useAppStore } from '../stores/useAppStore';
import type { BookDetail, Vocabulary } from '../types';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const setCurrentBook = useAppStore(state => state.setCurrentBook);

  const [book, setBook] = useState<BookDetail | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chapters' | 'vocab' | 'info'>('chapters');

  useEffect(() => {
    if (id) {
      loadBookDetail(id);
      loadVocabulary(id);
    }
  }, [id]);

  const loadBookDetail = async (bookId: string) => {
    try {
      setLoading(true);
      const response = await booksAPI.getBook(bookId);
      setBook(response.data);
    } catch (err) {
      console.error('Failed to load book detail:', err);
      setError('无法加载书籍详情');
    } finally {
      setLoading(false);
    }
  };

  const loadVocabulary = async (bookId: string) => {
    try {
      const response = await booksAPI.getVocabulary(bookId, 50);
      setVocabulary(response.data);
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
    }
  };

  const getReadingProgress = () => {
    if (!book) return { percentage: 0, chapter: 0 };
    const progress = progressStorage.get(book.id);
    if (!progress || book.chapters.length === 0) return { percentage: 0, chapter: 0 };

    const percentage = Math.round((progress.chapter_number / book.chapters.length) * 100);
    return { percentage, chapter: progress.chapter_number };
  };

  const handleStartReading = () => {
    if (book) {
      setCurrentBook(book);
      navigate('/reader');
    }
  };

  const handleChapterClick = (chapterNumber: number) => {
    if (book) {
      setCurrentBook(book);
      // 可以在这里设置初始章节号，通过 URL 参数或 store
      navigate(`/reader?chapter=${chapterNumber}`);
    }
  };

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">{error || '书籍不存在'}</div>
        <button
          onClick={() => navigate('/shelf')}
          className="text-teal-700 hover:underline"
        >
          返回书架
        </button>
      </main>
    );
  }

  const progress = getReadingProgress();

  return (
    <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-10">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-teal-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回</span>
      </button>

      {/* 书籍信息卡片 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-6">
        <div className="flex gap-8">
          {/* 左侧：封面 */}
          <div className="w-48 h-72 bg-gradient-to-br from-teal-100 to-blue-100 rounded-lg shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {book.cover ? (
              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-20 h-20 text-teal-300" />
            )}
            {book.level && (
              <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
                {book.level}
              </span>
            )}
          </div>

          {/* 右侧：信息 */}
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-serif mb-2">{book.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{book.author || '未知作者'}</p>

              {/* 统计信息 */}
              <div className="flex gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    共 {book.chapters.length} 章
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {book.word_count.toLocaleString()} 词
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    难度: {book.level || '未知'}
                  </span>
                </div>
              </div>

              {/* 阅读进度 */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>阅读进度</span>
                  <span>{progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                {progress.chapter > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    上次阅读到第 {progress.chapter} 章
                  </p>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={handleStartReading}
                className="flex items-center gap-2 px-8 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors shadow-lg font-medium"
              >
                <Play className="w-5 h-5" />
                {progress.chapter > 0 ? '继续阅读' : '开始阅读'}
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-teal-600 hover:text-teal-600 transition-colors">
                生词预习
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 标签页头部 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chapters')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'chapters'
                ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50'
                : 'text-gray-600 hover:text-teal-600'
            }`}
          >
            目录
          </button>
          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'vocab'
                ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50'
                : 'text-gray-600 hover:text-teal-600'
            }`}
          >
            高频词汇
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-teal-700 border-b-2 border-teal-700 bg-teal-50'
                : 'text-gray-600 hover:text-teal-600'
            }`}
          >
            简介
          </button>
        </div>

        {/* 标签页内容 */}
        <div className="p-6">
          {activeTab === 'chapters' && (
            <div className="space-y-2">
              {book.chapters.length === 0 ? (
                <p className="text-gray-500 text-center py-10">暂无章节</p>
              ) : (
                book.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    onClick={() => handleChapterClick(chapter.chapter_number)}
                    className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border ${
                      progress.chapter === chapter.chapter_number
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-transparent'
                    }`}
                  >
                    <span className="font-medium text-gray-800">
                      {chapter.title || `章节 ${chapter.chapter_number}`}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {chapter.word_count.toLocaleString()} 词
                      </span>
                      {progress.chapter === chapter.chapter_number && (
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                          当前章节
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'vocab' && (
            <div>
              {vocabulary.length === 0 ? (
                <p className="text-gray-500 text-center py-10">暂无词汇数据</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {vocabulary.map((vocab, index) => (
                    <div
                      key={vocab.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-500 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-bold text-gray-900">{vocab.word}</span>
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                          #{index + 1}
                        </span>
                      </div>
                      {vocab.phonetic && (
                        <p className="text-xs text-gray-500 mb-1">{vocab.phonetic}</p>
                      )}
                      <p className="text-xs text-gray-600">
                        出现 {vocab.frequency} 次
                      </p>
                      {vocab.definition && (
                        <p className="text-xs text-gray-700 mt-2 line-clamp-2">
                          {vocab.definition}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="prose max-w-none">
              {book.description ? (
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              ) : (
                <p className="text-gray-500 text-center py-10">暂无简介</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
