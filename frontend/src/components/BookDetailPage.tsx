import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, List, BookMarked, TrendingUp, Play, Info, Brain, GraduationCap } from 'lucide-react';
import { booksAPI } from '../services/api';
import { progressStorage, myShelfStorage } from '../services/storage';
import { useAppStore } from '../stores/useAppStore';
import type { BookDetail, Vocabulary } from '../types';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      // 自动添加到用户书架
      myShelfStorage.add(book.id);
      navigate(`/reader?from=book-detail&bookId=${book.id}`);
    }
  };

  const handleChapterClick = (chapterNumber: number) => {
    if (book) {
      setCurrentBook(book);
      // 自动添加到用户书架
      myShelfStorage.add(book.id);
      // 可以在这里设置初始章节号，通过 URL 参数或 store
      navigate(`/reader?chapter=${chapterNumber}&from=book-detail&bookId=${book.id}`);
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
  const difficultyTag = book.lexile || '***L'; // 蓝思值缺失时统一显示占位符
  const difficultyValue = difficultyTag;

  const handleBack = () => {
    const from = searchParams.get('from');

    if (from === 'shelf') {
      navigate('/shelf');
    } else if (from === 'my-shelf') {
      navigate('/my-shelf');
    } else {
      navigate('/');
    }
  };

  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-10">
      {/* 顶部按钮栏 */}
      <div className="flex items-center justify-between mb-6">
        {/* 返回按钮 */}
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleStartReading}
            className="w-10 h-10 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors shadow-lg flex items-center justify-center"
            title={progress.chapter > 0 ? '继续阅读' : '开始阅读'}
          >
            <Play className="w-5 h-5" />
          </button>
          <button
            className="w-10 h-10 border border-gray-300 text-gray-700 rounded-lg hover:border-teal-600 hover:text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center"
            title="生词预习"
          >
            <GraduationCap className="w-5 h-5" />
          </button>
        </div>
      </div>

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
            {/* 蓝思值彩条 */}
            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
              <div className="absolute top-3 right-[-20px] w-24 bg-blue-600 text-white text-[10px] font-bold py-1 text-center transform rotate-45 shadow-md">
                {difficultyTag}
              </div>
            </div>
          </div>

          {/* 右侧：信息 */}
          <div className="flex-grow flex flex-col justify-center pr-20">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-serif mb-2">{book.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{book.author || '未知作者'}</p>

              {/* 统计信息卡片 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <List className="w-7 h-7 text-teal-600 mb-2" />
                  <span className="font-bold text-gray-800 text-xl leading-none">{book.chapters.length}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">目录</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <BookMarked className="w-7 h-7 text-teal-600 mb-2" />
                  <span className="font-bold text-gray-800 text-xl leading-none">{(book.word_count / 1000).toFixed(1)}k</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">总单词</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <TrendingUp className="w-7 h-7 text-teal-600 mb-2" />
                  <span className="font-bold text-gray-800 text-xl leading-none">{difficultyValue}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">蓝思值</span>
                </div>
              </div>

              {/* 阅读进度 */}
              <div>
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
          </div>
        </div>
      </div>

      {/* 标签页导航按钮 */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'chapters'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-500 hover:text-teal-700'
          }`}
        >
          <List className="w-5 h-5" />
          <span>目录</span>
        </button>
        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'vocab'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-500 hover:text-teal-700'
          }`}
        >
          <Brain className="w-5 h-5" />
          <span>高频词汇</span>
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'info'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-500 hover:text-teal-700'
          }`}
        >
          <Info className="w-5 h-5" />
          <span>简介</span>
        </button>
      </div>

      {/* 标签页内容 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
            <div className="grid md:grid-cols-2 gap-6">
              {/* 高频词汇卡片 */}
              <div
                className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-teal-300 transition-all cursor-pointer group"
                onClick={() => {
                  // TODO: 跳转到高频词汇详情页 (暂不实现)
                  console.log('跳转到高频词汇页面');
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Brain className="w-6 h-6 text-teal-600" />
                    <span>高频词汇</span>
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    点击查看详情
                  </span>
                </div>
                {vocabulary.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">暂无数据</p>
                ) : (
                  <div className="space-y-3">
                    {vocabulary.slice(0, 5).map((vocab, index) => (
                      <div
                        key={vocab.id}
                        className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 group-hover:bg-amber-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-semibold text-gray-800">{vocab.word}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {vocab.frequency}次
                        </span>
                      </div>
                    ))}
                    {vocabulary.length > 5 && (
                      <p className="text-xs text-center text-gray-400 pt-2">
                        还有 {vocabulary.length - 5} 个词汇...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 挑战词汇卡片 */}
              <div
                className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-red-300 transition-all cursor-pointer group"
                onClick={() => {
                  // TODO: 跳转到挑战词汇学习页面 (暂不实现)
                  console.log('跳转到挑战词汇学习页面');
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-red-600" />
                    <span>挑战词汇</span>
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    点击开始学习
                  </span>
                </div>
                {vocabulary.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">暂无数据</p>
                ) : (
                  <div className="space-y-3">
                    {vocabulary
                      .filter(v => v.frequency <= 3)
                      .slice(0, 5)
                      .map((vocab, index) => (
                        <div
                          key={vocab.id}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 group-hover:bg-red-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-red-200 text-red-800 text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-gray-800">{vocab.word}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {vocab.frequency}次
                          </span>
                        </div>
                      ))}
                    {vocabulary.filter(v => v.frequency <= 3).length === 0 && (
                      <p className="text-gray-400 text-center py-8">暂无低频词汇</p>
                    )}
                    {vocabulary.filter(v => v.frequency <= 3).length > 5 && (
                      <p className="text-xs text-center text-gray-400 pt-2">
                        还有 {vocabulary.filter(v => v.frequency <= 3).length - 5} 个词汇...
                      </p>
                    )}
                  </div>
                )}
              </div>
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
    </main>
  );
}
