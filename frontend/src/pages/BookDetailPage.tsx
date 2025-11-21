import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import type { BookDetail, Vocabulary } from '../types';
import { progressStorage } from '../services/storage';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chapters' | 'vocabulary'>('chapters');

  useEffect(() => {
    if (id) {
      loadBook(id);
    }
  }, [id]);

  const loadBook = async (bookId: string) => {
    try {
      setLoading(true);
      const [bookRes, vocabRes] = await Promise.all([
        booksAPI.getBook(bookId),
        booksAPI.getVocabulary(bookId, 100),
      ]);
      setBook(bookRes.data);
      setVocabulary(vocabRes.data);
    } catch (error) {
      console.error('Failed to load book:', error);
    } finally {
      setLoading(false);
    }
  };

  const startReading = () => {
    if (!book) return;
    const progress = progressStorage.get(book.id);
    const chapter = progress?.current_chapter || 1;
    navigate(`/reader/${book.id}?chapter=${chapter}`);
  };

  // 计算阅读进度百分比
  const getProgress = () => {
    if (!book) return 0;
    const progress = progressStorage.get(book.id);
    if (!progress) return 0;
    return Math.round((progress.current_chapter / book.chapters.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">书籍未找到</p>
      </div>
    );
  }

  const progressPercent = getProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/books')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            ← 返回
          </button>
          <h1 className="text-xl font-bold text-gray-900">书籍详情</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Book info card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex gap-6">
            {/* Cover */}
            <div className="w-32 h-44 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
              {book.cover ? (
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center p-2">
                  <span className="text-white text-center text-sm font-bold">{book.title}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-2 truncate">{book.title}</h2>
              <p className="text-gray-500 mb-4">{book.author}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{vocabulary.length}</div>
                  <div className="text-xs text-gray-500">高频生词</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{book.word_count.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">总词数</div>
                </div>
              </div>

              {/* Progress */}
              {progressPercent > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>阅读进度</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Level badge */}
              {book.level && (
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {book.level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={startReading}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-medium text-gray-700">
              {progressPercent > 0 ? '继续阅读' : '开始阅读'}
            </span>
            {progressPercent > 0 && (
              <span className="text-xs text-blue-600">{progressPercent}%</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('vocabulary')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition"
          >
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="font-medium text-gray-700">高频生词</span>
            <span className="text-xs text-yellow-600">{vocabulary.length} 词</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex-1 py-4 text-center font-medium transition ${
                activeTab === 'chapters'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              章节目录
            </button>
            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`flex-1 py-4 text-center font-medium transition ${
                activeTab === 'vocabulary'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              高频生词
            </button>
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'chapters' ? (
              <div className="space-y-2">
                {book.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer"
                    onClick={() => navigate(`/reader/${book.id}?chapter=${chapter.chapter_number}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">
                        {chapter.chapter_number}. {chapter.title || `Chapter ${chapter.chapter_number}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {chapter.word_count > 0 && (
                        <span className="text-xs text-gray-400">
                          {chapter.word_count} 词
                        </span>
                      )}
                      <span className="text-gray-300">→</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {vocabulary.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无词汇数据</p>
                ) : (
                  vocabulary.map((vocab) => (
                    <div
                      key={vocab.id}
                      className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-bold text-lg text-gray-800">{vocab.word}</span>
                        {vocab.phonetic && (
                          <span className="text-gray-400 text-sm">{vocab.phonetic}</span>
                        )}
                        <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          {vocab.frequency}次
                        </span>
                      </div>
                      {vocab.definition && (
                        <p className="text-gray-600 mt-2 text-sm">{vocab.definition}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <h3 className="text-lg font-bold mb-3">简介</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {book.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
