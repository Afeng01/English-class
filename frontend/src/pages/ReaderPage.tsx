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

  const [book, setBook] = useState<BookDetail | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { settings, updateSetting, addWord, vocabulary } = useAppStore();

  // 词典弹窗
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordResult, setWordResult] = useState<DictionaryResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadBook(id);
    }
  }, [id]);

  useEffect(() => {
    const chapter = searchParams.get('chapter');
    if (chapter) {
      setChapterNumber(parseInt(chapter));
    }
  }, [searchParams]);

  useEffect(() => {
    if (id && chapterNumber) {
      loadChapter(id, chapterNumber);
    }
  }, [id, chapterNumber]);

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
    const word = target.textContent?.trim();

    if (!word || word.length < 2) return;

    // 提取纯单词（去除标点）
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!cleanWord) return;

    setSelectedWord(cleanWord);
    setPopoverPosition({ x: e.clientX, y: e.clientY });
    setLookupLoading(true);

    try {
      const response = await dictionaryAPI.lookup(cleanWord);
      setWordResult(response.data);
    } catch (error) {
      console.error('Lookup failed:', error);
      setWordResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const closePopover = () => {
    setSelectedWord(null);
    setWordResult(null);
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
    small: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '20px',
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
      {/* Top toolbar */}
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(`/books/${id}`)} className="text-gray-600 hover:text-gray-900">
            ← 返回
          </button>

          <div className="flex-1 text-center">
            <span className="font-medium">{book.title}</span>
            <span className="text-gray-500 text-sm ml-2">
              第 {chapterNumber} / {book.chapters.length} 章
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowToc(!showToc)}
              className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              目录
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              设置
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar TOC */}
        {showToc && (
          <aside className="w-64 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-60px)] overflow-y-auto sticky top-[60px]">
            <div className="p-4">
              <h3 className="font-bold mb-4">目录</h3>
              <div className="space-y-1">
                {book.chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => goToChapter(chapter.chapter_number)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      chapter.chapter_number === chapterNumber
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    第 {chapter.chapter_number} 章
                    {chapter.title && <div className="text-xs opacity-70">{chapter.title}</div>}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 px-8 py-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Chapter title */}
              {currentChapter?.title && (
                <h2 className="text-2xl font-bold mb-8 text-center">{currentChapter.title}</h2>
              )}

              {/* Content */}
              <div
                ref={contentRef}
                onClick={handleWordClick}
                className="prose prose-lg max-w-4xl mx-auto cursor-text select-text"
                style={{
                  fontSize: fontSizes[settings.font_size],
                  lineHeight: settings.line_height,
                }}
                dangerouslySetInnerHTML={{ __html: currentChapter?.content || '' }}
              />

              {/* Navigation */}
              <div className="flex justify-between items-center mt-12 max-w-4xl mx-auto">
                <button
                  onClick={prevChapter}
                  disabled={chapterNumber === 1}
                  className="px-6 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 上一章
                </button>
                <span className="text-gray-500">
                  {chapterNumber} / {book.chapters.length}
                </span>
                <button
                  onClick={nextChapter}
                  disabled={chapterNumber === book.chapters.length}
                  className="px-6 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
            ) : !wordResult ? (
              <p className="text-center text-gray-500">未找到释义</p>
            ) : (
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <h4 className="text-xl font-bold">{selectedWord}</h4>
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
