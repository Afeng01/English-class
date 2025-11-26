import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Type, List, Plus, Loader2, AlertCircle, X, Volume2, Check } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useAuthStore } from '../stores/useAuthStore';
import { booksAPI, dictionaryAPI } from '../services/api';
import { progressStorage, vocabularyStorage } from '../services/storage';
import type { Chapter, DictionaryResult } from '../types';
import Toast from './Toast';

export default function ReaderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentBook = useAppStore(state => state.currentBook);
  const addWord = useAppStore(state => state.addWord);
  const { user } = useAuthStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true); // 标记是否首次加载

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDefinition, setWordDefinition] = useState<DictionaryResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [wordAdded, setWordAdded] = useState(false); // 添加成功的反馈状态

  // Toast通知状态
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 弹窗状态
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');

  // 词典显示控制（默认都显示）
  const [showEnglish, setShowEnglish] = useState(() => {
    const saved = localStorage.getItem('showEnglish');
    return saved !== null ? saved === 'true' : true;
  });
  const [showChinese, setShowChinese] = useState(() => {
    const saved = localStorage.getItem('showChinese');
    return saved !== null ? saved === 'true' : true;
  });

  // 保存显示偏好到 localStorage
  useEffect(() => {
    localStorage.setItem('showEnglish', String(showEnglish));
  }, [showEnglish]);

  useEffect(() => {
    localStorage.setItem('showChinese', String(showChinese));
  }, [showChinese]);

  const fontSizeMap = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl',
    xlarge: 'text-2xl'
  };

  // 加载章节列表
  useEffect(() => {
    if (!currentBook) return;

    const loadChapters = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await booksAPI.getChapters(currentBook.id);
        setChapters(response.data);

        // 只在首次加载时确定初始章节
        if (isInitialLoad.current) {
          // 优先级：URL参数 > localStorage进度 > 默认第一章
          const urlChapterParam = searchParams.get('chapter');
          let chapterIndex = 0;

          if (urlChapterParam) {
            // 从URL参数获取章节号，转换为索引
            const chapterNumber = parseInt(urlChapterParam);
            if (!isNaN(chapterNumber) && chapterNumber > 0) {
              chapterIndex = chapterNumber - 1;
              console.log(`从URL参数加载章节: ${chapterNumber} (索引: ${chapterIndex})`);
            }
          } else {
            // 从本地存储获取阅读进度
            const progress = progressStorage.get(currentBook.id);
            chapterIndex = progress ? progress.chapter_number - 1 : 0;
            console.log(`从localStorage加载章节: ${chapterIndex + 1} (索引: ${chapterIndex})`);
          }

          // 确保索引在有效范围内
          if (chapterIndex < 0) chapterIndex = 0;
          if (response.data.length > 0 && chapterIndex >= response.data.length) {
            chapterIndex = response.data.length - 1;
          }

          setCurrentChapterIndex(chapterIndex);
          isInitialLoad.current = false;
        }
      } catch (err) {
        console.error('Failed to load chapters:', err);
        setError('无法加载章节列表');
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, [currentBook, searchParams]);

  // 监听URL参数变化（用于浏览器前进/后退）
  useEffect(() => {
    if (!currentBook || chapters.length === 0 || isInitialLoad.current) return;

    const urlChapterParam = searchParams.get('chapter');
    if (urlChapterParam) {
      const chapterNumber = parseInt(urlChapterParam);
      if (!isNaN(chapterNumber) && chapterNumber > 0) {
        const newIndex = chapterNumber - 1;
        // 只有当索引发生变化时才更新
        if (newIndex !== currentChapterIndex && newIndex >= 0 && newIndex < chapters.length) {
          console.log(`URL参数变化，切换到章节: ${chapterNumber}`);
          setCurrentChapterIndex(newIndex);
        }
      }
    }
  }, [searchParams, chapters, currentBook, currentChapterIndex]);

  // 加载当前章节内容
  useEffect(() => {
    if (!currentBook || chapters.length === 0) return;

    // 确保 currentChapterIndex 有效
    if (currentChapterIndex < 0 || currentChapterIndex >= chapters.length) {
      console.warn('Invalid chapter index:', currentChapterIndex);
      return;
    }

    const loadChapter = async () => {
      try {
        setLoading(true);
        setError(null);
        const chapterNumber = chapters[currentChapterIndex].chapter_number;
        console.log('Loading chapter:', chapterNumber, 'at index:', currentChapterIndex);
        const response = await booksAPI.getChapter(currentBook.id, chapterNumber);
        setCurrentChapter(response.data);

        // 保存阅读进度
        progressStorage.save({
          book_id: currentBook.id,
          chapter_number: chapterNumber,
          position: 0,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to load chapter:', err);
        setError('无法加载章节内容');
      } finally {
        setLoading(false);
      }
    };

    loadChapter();
  }, [currentBook, chapters, currentChapterIndex]);

  // 从点击位置提取单词
  const getWordAtPoint = (x: number, y: number): string | null => {
    let range: Range | null = null;

    // 获取点击位置的 range
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y);
    } else if ((document as any).caretPositionFromPoint) {
      const position = (document as any).caretPositionFromPoint(x, y);
      if (position) {
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
      }
    }

    if (!range) return null;

    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) return null;

    const text = textNode.textContent || '';
    const offset = range.startOffset;

    // 向前找到单词开始位置
    let start = offset;
    while (start > 0 && /[a-zA-Z'-]/.test(text[start - 1])) {
      start--;
    }

    // 向后找到单词结束位置
    let end = offset;
    while (end < text.length && /[a-zA-Z'-]/.test(text[end])) {
      end++;
    }

    const word = text.slice(start, end).trim();
    return word && /^[a-zA-Z'-]+$/.test(word) ? word : null;
  };

  // 监听内容区域的单词/短语点击
  useEffect(() => {
    const handleContentClick = (event: MouseEvent) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      // 优先使用选中的文本（支持单词、短语、句子）
      if (selectedText) {
        // 允许英文字母、空格、连字符、撇号、逗号、句号等常见标点
        // 限制最大长度为200字符，避免选择过长文本
        if (selectedText.length <= 200 && /^[a-zA-Z\s',.!?-]+$/.test(selectedText)) {
          setSelectedWord(selectedText.toLowerCase());
          console.log('查询选中文本:', selectedText);
          return;
        }
      }

      // 否则提取点击位置的单词
      const word = getWordAtPoint(event.clientX, event.clientY);
      if (word) {
        setSelectedWord(word.toLowerCase());
        console.log('查询点击单词:', word);
      }
    };

    const contentEl = contentRef.current;
    if (contentEl) {
      contentEl.addEventListener('click', handleContentClick);
      return () => contentEl.removeEventListener('click', handleContentClick);
    }
  }, [currentChapter]);

  // 查询单词释义（后端返回中英文全部）
  useEffect(() => {
    if (!selectedWord) {
      setWordDefinition(null);
      return;
    }

    const lookupWord = async () => {
      try {
        setLookupLoading(true);
        const response = await dictionaryAPI.lookup(selectedWord);
        const data = response.data;
        setWordDefinition(data);

        // 调试日志：显示接收到的释义数量
        if (data && data.meanings) {
          console.log(`前端接收到 ${data.meanings.length} 个meanings，共 ${data.meanings.reduce((sum, m) => sum + (m.definitions?.length || 0), 0)} 条释义`);
        }
      } catch (err) {
        console.error('Failed to lookup word:', err);
        setWordDefinition(null);
      } finally {
        setLookupLoading(false);
      }
    };

    lookupWord();
  }, [selectedWord]);

  // 添加到生词本
  const handleAddWord = async () => {
    if (!wordDefinition) return;

    // 检查是否已登录
    if (!user) {
      setToast({ message: '请登录后使用生词本功能', type: 'info' });
      return;
    }

    // 乐观UI更新 - 立即显示为已添加
    setWordAdded(true);

    const definition = wordDefinition.meanings[0]?.definitions?.[0]?.definition || '';
    const success = await addWord({
      word: wordDefinition.word,
      phonetic: wordDefinition.phonetic,
      definition,
      status: 'learning',
    });

    if (success) {
      setToast({ message: '已添加到生词本', type: 'success' });
      setTimeout(() => setWordAdded(false), 2000); // 2秒后隐藏提示
    } else {
      // 失败时恢复乐观更新
      setWordAdded(false);
      setToast({ message: '添加失败，请重试', type: 'error' });
    }
  };

  // 章节导航
  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      const newIndex = currentChapterIndex - 1;
      const newChapterNumber = chapters[newIndex].chapter_number;
      setCurrentChapterIndex(newIndex);
      setSelectedWord(null);
      navigate(`/reader?chapter=${newChapterNumber}`, { replace: true });
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      const newIndex = currentChapterIndex + 1;
      const newChapterNumber = chapters[newIndex].chapter_number;
      setCurrentChapterIndex(newIndex);
      setSelectedWord(null);
      navigate(`/reader?chapter=${newChapterNumber}`, { replace: true });
    }
  };

  // 如果没有选中书籍，显示提示
  if (!currentBook) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center bg-[#FDFBF7]">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-600">请先选择一本书籍</p>
        <button
          onClick={() => navigate('/shelf')}
          className="mt-4 px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
        >
          前往书架
        </button>
      </main>
    );
  }

  return (
    <>
      {/* Toast通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="flex-grow flex flex-col bg-[#FDFBF7]">
      <div className="h-14 border-b border-[#EAE4D6] flex items-center justify-between px-6 bg-[#FDFBF7] sticky top-0 z-40">
        <button
          className="text-gray-500 hover:text-teal-700 flex items-center gap-1"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" /> <span className="text-sm">返回</span>
        </button>
        <div className="text-sm font-bold text-gray-700 font-serif">{currentBook.title}</div>
        <div className="flex gap-3 text-gray-500">
          <button title="字体设置" onClick={() => { setShowSettings(!showSettings); setShowToc(false); }}>
            <Type className="w-5 h-5" />
          </button>
          <button title="目录" onClick={() => { setShowToc(!showToc); setShowSettings(false); }}>
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 阅读设置弹窗 */}
      {showSettings && (
        <div className="absolute top-14 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-72">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">阅读设置</h3>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 字体大小 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">字体大小</label>
            <div className="flex gap-2">
              {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`flex-1 py-2 rounded text-sm ${
                    fontSize === size
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size === 'small' ? '小' : size === 'medium' ? '中' : size === 'large' ? '大' : '特大'}
                </button>
              ))}
            </div>
          </div>

          {/* 词典显示控制 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">词典显示</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEnglish}
                  onChange={(e) => setShowEnglish(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">显示英文释义</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showChinese}
                  onChange={(e) => setShowChinese(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">显示中文翻译</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              默认查询中英文全部释义，可根据需要隐藏
            </p>
          </div>
        </div>
      )}

      {/* 目录抽屉 */}
      {showToc && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setShowToc(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">目录</h3>
                <button onClick={() => setShowToc(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-2">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      setCurrentChapterIndex(index);
                      setShowToc(false);
                      window.scrollTo(0, 0);
                      // 更新URL参数，使用replace避免增加历史记录
                      navigate(`/reader?chapter=${chapter.chapter_number}`, { replace: true });
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      index === currentChapterIndex
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-sm">{chapter.title || `章节 ${chapter.chapter_number}`}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex-grow flex relative">
        <div className="flex-grow max-w-3xl mx-auto py-12 px-8 md:px-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : currentChapter ? (
            <>
              <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8">
                {currentChapter.title || `第 ${currentChapter.chapter_number} 章`}
              </h1>
              <div
                ref={contentRef}
                className={`font-serif ${fontSizeMap[fontSize]} leading-loose text-gray-800 prose prose-lg max-w-none`}
                dangerouslySetInnerHTML={{ __html: currentChapter.content || '' }}
              />

              <div className="flex justify-between mt-16 pt-8 border-t border-[#EAE4D6]">
                <button
                  onClick={goToPreviousChapter}
                  disabled={currentChapterIndex === 0}
                  className={`${
                    currentChapterIndex === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-teal-700 font-medium hover:underline'
                  }`}
                >
                  上一章
                </button>
                <button
                  onClick={goToNextChapter}
                  disabled={currentChapterIndex === chapters.length - 1}
                  className={`${
                    currentChapterIndex === chapters.length - 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-teal-700 font-medium hover:underline'
                  }`}
                >
                  下一章
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-500">暂无章节内容</p>
            </div>
          )}
        </div>

          <div className="w-72 border-l border-[#EAE4D6] bg-white hidden lg:block p-6">
            <div className="sticky top-20 flex flex-col max-h-[calc(100vh-6rem)]">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Selected Word</h4>
              {selectedWord ? (
                lookupLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                  </div>
                ) : wordDefinition ? (
                  <>
                    <div className="flex-grow overflow-y-auto mb-4 pr-2">
                      {/* 单词标题区域 */}
                      <div className="mb-4">
                        <div
                          className="font-bold text-teal-800 font-serif capitalize break-words"
                          style={{
                            fontSize: selectedWord.length > 20 ? '1.25rem' : '1.5rem',
                            lineHeight: '1.3'
                          }}
                        >
                          {wordDefinition.word}
                        </div>

                        {/* 音标 + 发音按钮 */}
                        {wordDefinition.phonetic && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-gray-500 italic">{wordDefinition.phonetic}</span>
                            <button
                              onClick={() => {
                                // TODO: 实现 TTS 发音功能
                                console.log('播放发音:', wordDefinition.word);
                              }}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              title="点击发音（功能开发中）"
                            >
                              <Volume2 className="w-4 h-4 text-gray-400 hover:text-teal-600" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 释义列表（根据显示偏好过滤） */}
                      {wordDefinition.meanings
                        .filter((meaning: any) => {
                          // 根据用户的显示偏好过滤
                          const lang = meaning.lang || 'en';
                          if (lang === 'en' && !showEnglish) return false;
                          if (lang === 'zh' && !showChinese) return false;
                          return true;
                        })
                        .map((meaning: any, idx: number) => (
                          <div key={idx} className="mt-4 pb-3 border-b border-gray-100 last:border-0">
                            {meaning.partOfSpeech && (
                              <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
                                {meaning.partOfSpeech}
                                {/* 显示语言标签 */}
                                {meaning.lang && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs font-normal bg-gray-100 text-gray-600 rounded">
                                    {meaning.lang === 'en' ? '英' : '中'}
                                  </span>
                                )}
                              </div>
                            )}
                            {meaning.definitions?.map((def: any, defIdx: number) => (
                              <div key={defIdx} className="mb-3 last:mb-0">
                                <p
                                  className="text-gray-700 leading-relaxed break-words"
                                  style={{
                                    fontSize: def.definition.length > 100 ? '0.8125rem' : '0.875rem'
                                  }}
                                >
                                  {defIdx + 1}. {def.definition}
                                </p>
                                {def.example && (
                                  <p
                                    className="text-gray-500 italic mt-1 ml-3 break-words"
                                    style={{
                                      fontSize: def.example.length > 80 ? '0.6875rem' : '0.75rem'
                                    }}
                                  >
                                    &ldquo;{def.example}&rdquo;
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={handleAddWord}
                      disabled={vocabularyStorage.has(wordDefinition.word) || wordAdded}
                      className={`w-full py-2 rounded text-sm flex items-center justify-center gap-2 transition-all ${
                        wordAdded
                          ? 'bg-green-500 text-white'
                          : vocabularyStorage.has(wordDefinition.word)
                          ? 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'border border-teal-600 text-teal-600 hover:bg-teal-50'
                      }`}
                    >
                      {wordAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          已添加
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          {vocabularyStorage.has(wordDefinition.word) ? '已在生词本' : '加入生词本'}
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">无法找到该内容的释义</div>
                )
              ) : (
                <div className="text-sm text-gray-400">
                  <p className="mb-2">点击文章中的单词查看释义</p>
                  <p className="text-xs text-gray-400">或选中短语、句子进行翻译</p>
                </div>
              )}
            </div>
          </div>
      </div>
    </main>
    </>
  );
}
