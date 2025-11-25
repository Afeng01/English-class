import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { booksAPI, dictionaryAPI } from '../services/api';
import type { BookDetail, Chapter, DictionaryResult } from '../types';
import { progressStorage } from '../services/storage';
import { useAppStore } from '../stores/useAppStore';

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 从URL参数初始化章节号，避免先加载第一章再加载正确章节的问题
  const initialChapter = parseInt(searchParams.get('chapter') || '1');

  const [book, setBook] = useState<BookDetail | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapterNumber, setChapterNumber] = useState(initialChapter);
  const [loading, setLoading] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 沉浸式工具栏状态
  const [showToolbar, setShowToolbar] = useState(true);
  const hideToolbarTimer = useRef<number | null>(null);

  const { settings, updateSetting, addWord } = useAppStore();

  // 词典弹窗
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordResult, setWordResult] = useState<DictionaryResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadBook(id);
    }
  }, [id]);

  // 监听URL参数变化，同步更新章节号（用于浏览器前进/后退）
  useEffect(() => {
    const chapter = searchParams.get('chapter');
    if (chapter) {
      const chapterNum = parseInt(chapter);
      if (chapterNum !== chapterNumber) {
        setChapterNumber(chapterNum);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (id && chapterNumber) {
      loadChapter(id, chapterNumber);
    }
  }, [id, chapterNumber]);

  // 沉浸式工具栏：监听鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 鼠标在顶部100px区域时显示工具栏
      if (e.clientY < 100) {
        setShowToolbar(true);
        // 清除之前的定时器
        if (hideToolbarTimer.current) {
          clearTimeout(hideToolbarTimer.current);
        }
      } else {
        // 鼠标离开顶部区域，3秒后隐藏工具栏
        if (hideToolbarTimer.current) {
          clearTimeout(hideToolbarTimer.current);
        }
        hideToolbarTimer.current = window.setTimeout(() => {
          setShowToolbar(false);
        }, 3000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideToolbarTimer.current) {
        clearTimeout(hideToolbarTimer.current);
      }
    };
  }, []);

  const loadBook = async (bookId: string) => {
    try {
      const response = await booksAPI.getBook(bookId);
      setBook(response.data);
    } catch (error) {
      console.error('Failed to load book:', error);
    }
  };

  const loadChapter = async (bookId: string, num: number) => {
    try {
      setLoading(true);
      const response = await booksAPI.getChapter(bookId, num);
      setCurrentChapter(response.data);

      // 保存阅读进度
      if (id) {
        progressStorage.save({
          book_id: id,
          current_chapter: num,
          current_page: 0,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to load chapter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWordClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 获取点击位置的文本
    const selection = window.getSelection();
    let word = '';

    // 如果有选中文本，使用选中的文本
    if (selection && selection.toString().trim()) {
      word = selection.toString().trim();
    } else {
      // 否则，智能提取点击位置的单词
      const text = target.textContent || '';
      const clickX = e.clientX;

      // 使用Range API获取点击位置的字符偏移
      const range = document.caretRangeFromPoint(clickX, e.clientY);
      if (range) {
        const offset = range.startOffset;

        // 向前查找单词边界
        let start = offset;
        while (start > 0 && /[a-zA-Z]/.test(text[start - 1])) {
          start--;
        }

        // 向后查找单词边界
        let end = offset;
        while (end < text.length && /[a-zA-Z]/.test(text[end])) {
          end++;
        }

        word = text.substring(start, end);
      } else {
        // 降级方案：获取元素的文本内容
        word = target.textContent?.trim() || '';
      }
    }

    if (!word || word.length < 2) return;

    // 提取纯单词（去除标点和数字）
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!cleanWord || cleanWord.length < 2) return;

    setSelectedWord(cleanWord);
    setPopoverPosition({ x: e.clientX, y: e.clientY });
    setLookupLoading(true);
    setLookupError(null);
    setWordResult(null);

    try {
      const response = await dictionaryAPI.lookup(cleanWord);
      setWordResult(response.data);
      setLookupError(null);
    } catch (error: any) {
      console.error('Lookup failed:', error);
      setWordResult(null);

      // 提取错误消息
      let errorMessage = '未找到该单词的释义';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // 如果detail是对象，提取message字段
        if (typeof detail === 'object' && detail.message) {
          errorMessage = detail.message;
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setLookupError(errorMessage);
    } finally {
      setLookupLoading(false);
    }
  };

  const closePopover = () => {
    setSelectedWord(null);
    setWordResult(null);
    setLookupError(null);
  };

  const playAudio = () => {
    if (wordResult?.audio) {
      new Audio(wordResult.audio).play();
    } else if (selectedWord) {
      // 使用 Web Speech API
      const utterance = new SpeechSynthesisUtterance(selectedWord);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const addToVocabulary = () => {
    if (!selectedWord || !wordResult) return;

    const definition = wordResult.meanings[0]?.definitions[0]?.definition || '';

    addWord({
      word: selectedWord,
      phonetic: wordResult.phonetic,
      definition,
      status: 'learning',
      source_book_id: id,
    });

    alert('已添加到生词本');
  };

  const goToChapter = (num: number) => {
    setChapterNumber(num);
    setShowToc(false);
  };

  const prevChapter = () => {
    if (chapterNumber > 1) {
      goToChapter(chapterNumber - 1);
    }
  };

  const nextChapter = () => {
    if (book && chapterNumber < book.chapters.length) {
      goToChapter(chapterNumber + 1);
    }
  };

  const fontSizes = {
    small: '16px',
    medium: '18px',
    large: '20px',
    xlarge: '22px',
  };

  const themes = {
    light: { bg: 'bg-white', text: 'text-gray-900' },
    dark: { bg: 'bg-gray-900', text: 'text-gray-100' },
    sepia: { bg: 'bg-[#f4ecd8]', text: 'text-gray-900' },
  };

  if (!book) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className={`min-h-screen ${themes[settings.theme].bg} ${themes[settings.theme].text}`}>
      {/* Top toolbar - 沉浸式：自动隐藏 */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 transition-transform duration-300 ease-in-out ${
          showToolbar ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/books/${id}`)}
            className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-100 flex-shrink-0 transition-colors duration-200 font-medium"
          >
            ← 返回
          </button>

          <div className="flex-1 text-center px-4 min-w-0">
            <div className="font-semibold text-base truncate text-gray-900 dark:text-gray-100">{book.title}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-3 mt-1">
              <span>第 {chapterNumber} 章 / 共 {book.chapters.length} 章</span>
              {currentChapter && currentChapter.word_count > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {currentChapter.word_count.toLocaleString()} 词
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowToc(!showToc)}
              className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 font-medium text-sm"
            >
              📚 目录
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 font-medium text-sm"
            >
              ⚙️ 设置
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区域 - 添加顶部间距以避免被工具栏遮挡 */}
      <div className="flex max-w-7xl mx-auto pt-20">
        {/* Sidebar TOC - macOS 风格 */}
        {showToc && (
          <aside className="w-72 bg-[#F5F5F5] dark:bg-gray-800 border-r border-gray-200/60 dark:border-gray-700 h-[calc(100vh-80px)] overflow-y-auto sticky top-20">
            <div className="p-6">
              {/* 标题 */}
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-2">
                目录
              </h3>

              {/* 章节列表 */}
              <div className="space-y-0.5">
                {book.chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => goToChapter(chapter.chapter_number)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                      chapter.chapter_number === chapterNumber
                        ? 'bg-[#E5E5E5] dark:bg-gray-700 shadow-sm'
                        : 'hover:bg-white/60 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {/* 章节标题和页码 */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm leading-snug ${
                          chapter.chapter_number === chapterNumber
                            ? 'font-semibold text-gray-900 dark:text-gray-100'
                            : 'font-medium text-gray-700 dark:text-gray-300'
                        }`}>
                          <span className="text-gray-400 dark:text-gray-500 font-normal mr-1.5">
                            {chapter.chapter_number}.
                          </span>
                          <span className="line-clamp-2">
                            {chapter.title || `Chapter ${chapter.chapter_number}`}
                          </span>
                        </div>
                      </div>

                      {/* 页码右对齐 */}
                      {chapter.word_count > 0 && (
                        <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 font-medium tabular-nums">
                          {Math.ceil(chapter.word_count / 250)}
                        </div>
                      )}
                    </div>

                    {/* 字数统计（悬浮时显示） */}
                    {chapter.word_count > 0 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {chapter.word_count.toLocaleString()} 词
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main content - 优化阅读体验 */}
        <main className="flex-1 px-12 py-16">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-6 text-gray-500 dark:text-gray-400">加载中...</p>
            </div>
          ) : (
            <>
              {/* Chapter title - 更大更突出 */}
              {currentChapter?.title && (
                <h2 className="text-4xl font-bold mb-12 text-center leading-tight">
                  <span className="text-gray-400 dark:text-gray-500 font-normal">{chapterNumber}.</span>{' '}
                  {currentChapter.title}
                </h2>
              )}

              {/* Content - 更大的页边距和更舒适的排版 */}
              <div className="relative">
                <div
                  ref={contentRef}
                  onClick={handleWordClick}
                  className="prose prose-xl max-w-5xl mx-auto cursor-text select-text prose-p:leading-relaxed prose-p:mb-6 prose-headings:font-bold prose-headings:tracking-tight"
                  style={{
                    fontSize: fontSizes[settings.font_size],
                    lineHeight: settings.line_height,
                    maxWidth: '900px', // 限制最大宽度，优化阅读舒适度
                  }}
                  dangerouslySetInnerHTML={{ __html: currentChapter?.content || '' }}
                />

                {/* 页码指示器 - macOS 风格（底部居中）*/}
                {currentChapter && (
                  <div className="flex items-center justify-center gap-6 mt-16 mb-8 text-sm text-gray-400 dark:text-gray-500">
                    <span className="font-medium">
                      第 {chapterNumber} 章 / 共 {book.chapters.length} 章
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <span>
                      本章约 {currentChapter.word_count > 0 ? Math.ceil(currentChapter.word_count / 250) : 1} 页
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <span>
                      {currentChapter.word_count.toLocaleString()} 词
                    </span>
                  </div>
                )}
              </div>

              {/* Navigation - 优化按钮样式 */}
              <div className="flex justify-between items-center mt-20 mb-12 max-w-5xl mx-auto" style={{ maxWidth: '900px' }}>
                <button
                  onClick={prevChapter}
                  disabled={chapterNumber === 1}
                  className="px-8 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                >
                  ← 上一章
                </button>
                <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                  第 {chapterNumber} 章 / 共 {book.chapters.length} 章
                </span>
                <button
                  onClick={nextChapter}
                  disabled={chapterNumber === book.chapters.length}
                  className="px-8 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                >
                  下一章 →
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center" onClick={() => setShowSettings(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">阅读设置</h3>

            <div className="space-y-4">
              {/* Font size */}
              <div>
                <label className="block font-medium mb-2">字体大小</label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateSetting('font_size', size)}
                      className={`px-3 py-1 rounded ${
                        settings.font_size === size ? 'bg-blue-600 text-white' : 'bg-gray-200'
                      }`}
                    >
                      {size === 'xlarge' ? '特大' : size === 'large' ? '大' : size === 'medium' ? '中' : '小'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="block font-medium mb-2">主题</label>
                <div className="flex gap-2">
                  {(['light', 'dark', 'sepia'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => updateSetting('theme', theme)}
                      className={`px-3 py-1 rounded ${
                        settings.theme === theme ? 'bg-blue-600 text-white' : 'bg-gray-200'
                      }`}
                    >
                      {theme === 'light' ? '日间' : theme === 'dark' ? '夜间' : '护眼'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line height */}
              <div>
                <label className="block font-medium mb-2">行高: {settings.line_height}</label>
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={settings.line_height}
                  onChange={(e) => updateSetting('line_height', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Word popover */}
      {selectedWord && (
        <div className="fixed inset-0 z-30" onClick={closePopover}>
          <div
            className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto"
            style={{ top: popoverPosition.y + 10, left: popoverPosition.x - 150 }}
            onClick={(e) => e.stopPropagation()}
          >
            {lookupLoading ? (
              <p className="text-center text-gray-500">查询中...</p>
            ) : lookupError ? (
              <div className="text-center">
                <p className="text-red-500 mb-2">{lookupError}</p>
                <p className="text-gray-400 text-sm">尝试查询的单词：{selectedWord}</p>
              </div>
            ) : !wordResult ? (
              <p className="text-center text-gray-500">未找到释义</p>
            ) : (
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <h4 className="text-xl font-bold">{wordResult.word}</h4>
                  {wordResult.phonetic && (
                    <span className="text-gray-500 text-sm">{wordResult.phonetic}</span>
                  )}
                  <button
                    onClick={playAudio}
                    className="ml-auto text-blue-600 hover:text-blue-700"
                  >
                    🔊
                  </button>
                </div>

                {/* 词形还原提示 */}
                {wordResult.lemma && wordResult.searched_word && (
                  <div className="mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-md text-sm">
                    <span className="text-blue-700 dark:text-blue-300">
                      "{wordResult.searched_word}" 的词根是 "{wordResult.lemma}"
                    </span>
                  </div>
                )}

                {wordResult.meanings.map((meaning, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="text-sm font-medium text-gray-600 mb-1">
                      {meaning.partOfSpeech}
                    </div>
                    {meaning.definitions.map((def, i) => (
                      <div key={i} className="text-sm mb-2">
                        <p className="text-gray-700 dark:text-gray-300">{def.definition}</p>
                        {def.example && (
                          <p className="text-gray-500 text-xs mt-1 italic">"{def.example}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                <button
                  onClick={addToVocabulary}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  加入生词本
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
