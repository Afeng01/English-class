import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { List, Plus, Loader2, AlertCircle, X, Volume2, Check, Bookmark, Settings, Maximize2, Minimize2, Sun, Moon, ChevronLeft, Eye, EyeOff, PanelRightClose, PanelRightOpen, GripVertical } from 'lucide-react';
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
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono' | 'kai' | 'fangsong' | 'system'>(() => {
    const saved = localStorage.getItem('fontFamily');
    return (saved as any) || 'serif';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 主题状态
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  // 词典面板模式：fixed(固定), floating(悬浮), hidden(隐藏)
  const [dictionaryMode, setDictionaryMode] = useState<'fixed' | 'floating' | 'hidden'>('fixed');
  const [floatingPosition, setFloatingPosition] = useState({ x: window.innerWidth - 400, y: 100 });
  const [floatingSize, setFloatingSize] = useState({ width: 380, height: 500 });

  // 侧边栏宽度和拖拽状态
  const [sidebarWidth, setSidebarWidth] = useState(288); // 默认w-72=288px
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // 悬浮窗口拖拽和调整大小状态
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [isResizingWindow, setIsResizingWindow] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'ne' | 'sw' | 'nw' | 's' | 'e' | 'n' | 'w' | ''>('');
  const windowDragStart = useRef({ x: 0, y: 0 });
  const windowStartPos = useRef({ x: 0, y: 0 });
  const windowStartSize = useRef({ width: 0, height: 0 });

  // 滚动状态
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);

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

  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    // 应用主题到document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 滚动监听：隐藏/显示顶部栏 + 计算阅读进度
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 向下滚动超过100px时隐藏顶部栏，向上滚动时显示
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowTopBar(false);
      } else {
        setShowTopBar(true);
      }
      setLastScrollY(currentScrollY);

      // 计算阅读进度
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrolled = currentScrollY;
      const progress = (scrolled / (documentHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(Math.max(progress, 0), 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const fontSizeMap = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl',
    xlarge: 'text-2xl'
  };

  const fontFamilyMap = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
    kai: 'font-[KaiTi]',
    fangsong: 'font-[FangSong]',
    system: 'font-system'
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

  // 全屏API处理
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('进入全屏失败:', err);
        setToast({ message: '无法进入全屏模式', type: 'error' });
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('退出全屏失败:', err);
      }
    }
  };

  // 监听全屏变化事件
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 拖拽调整侧边栏宽度
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = dragStartX.current - e.clientX; // 向左拖是正值
      const newWidth = dragStartWidth.current + deltaX;
      // 限制宽度范围: 256px(w-64) 到 512px(w-128)
      const clampedWidth = Math.min(Math.max(newWidth, 256), 512);
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 悬浮窗口拖拽移动
  const handleWindowDragStart = (e: React.MouseEvent) => {
    setIsDraggingWindow(true);
    windowDragStart.current = { x: e.clientX, y: e.clientY };
    windowStartPos.current = { ...floatingPosition };
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDraggingWindow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - windowDragStart.current.x;
      const deltaY = e.clientY - windowDragStart.current.y;
      const newX = windowStartPos.current.x + deltaX;
      const newY = windowStartPos.current.y + deltaY;

      // 限制在视口内
      const maxX = window.innerWidth - floatingSize.width;
      const maxY = window.innerHeight - floatingSize.height;

      setFloatingPosition({
        x: Math.min(Math.max(newX, 0), maxX),
        y: Math.min(Math.max(newY, 0), maxY)
      });
    };

    const handleMouseUp = () => {
      setIsDraggingWindow(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWindow, floatingSize]);

  // 悬浮窗口调整大小
  const handleResizeStart = (e: React.MouseEvent, direction: 'se' | 'ne' | 'sw' | 'nw' | 's' | 'e' | 'n' | 'w') => {
    setIsResizingWindow(true);
    setResizeDirection(direction);
    windowDragStart.current = { x: e.clientX, y: e.clientY };
    windowStartPos.current = { ...floatingPosition };
    windowStartSize.current = { ...floatingSize };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isResizingWindow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - windowDragStart.current.x;
      const deltaY = e.clientY - windowDragStart.current.y;

      let newWidth = windowStartSize.current.width;
      let newHeight = windowStartSize.current.height;
      let newX = windowStartPos.current.x;
      let newY = windowStartPos.current.y;

      // 根据方向调整大小和位置
      if (resizeDirection.includes('e')) {
        newWidth = windowStartSize.current.width + deltaX;
      }
      if (resizeDirection.includes('w')) {
        newWidth = windowStartSize.current.width - deltaX;
        newX = windowStartPos.current.x + deltaX;
      }
      if (resizeDirection.includes('s')) {
        newHeight = windowStartSize.current.height + deltaY;
      }
      if (resizeDirection.includes('n')) {
        newHeight = windowStartSize.current.height - deltaY;
        newY = windowStartPos.current.y + deltaY;
      }

      // 限制最小和最大尺寸
      const minWidth = 256;
      const minHeight = 300;
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.9;

      newWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      newHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

      // 如果是左侧或上侧调整，需要调整位置
      if (resizeDirection.includes('w')) {
        newX = windowStartPos.current.x + (windowStartSize.current.width - newWidth);
      }
      if (resizeDirection.includes('n')) {
        newY = windowStartPos.current.y + (windowStartSize.current.height - newHeight);
      }

      setFloatingSize({ width: newWidth, height: newHeight });
      setFloatingPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizingWindow(false);
      setResizeDirection('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingWindow, resizeDirection]);

  const buildChapterUrl = (chapterNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('chapter', String(chapterNumber));
    return `/reader?${params.toString()}`;
  };

  // 章节导航
  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      const newIndex = currentChapterIndex - 1;
      const newChapterNumber = chapters[newIndex].chapter_number;
      setCurrentChapterIndex(newIndex);
      setSelectedWord(null);
      navigate(buildChapterUrl(newChapterNumber), { replace: true });
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      const newIndex = currentChapterIndex + 1;
      const newChapterNumber = chapters[newIndex].chapter_number;
      setCurrentChapterIndex(newIndex);
      setSelectedWord(null);
      navigate(buildChapterUrl(newChapterNumber), { replace: true });
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

      <main className={`flex-grow flex flex-col transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#FDFBF7]'}`}>
      {/* 顶部导航栏 - 下滑时隐藏 */}
      <div
        className={`h-14 border-b flex items-center justify-between px-6 sticky z-40 transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-[#1a1a1a] border-[#333]'
            : 'bg-[#FDFBF7] border-[#EAE4D6]'
        } ${showTopBar ? 'top-0' : '-top-14'}`}
      >
          {/* 左侧：返回、主页、目录 */}
          <div className="flex items-center gap-3">
            <button
              title="返回"
              className={`${theme === 'dark' ? 'text-gray-400 hover:text-teal-400' : 'text-gray-500 hover:text-teal-700'}`}
              onClick={() => {
                const from = searchParams.get('from');
                const bookId = searchParams.get('bookId');

                if (from === 'book-detail' && bookId) {
                  navigate(`/book/${bookId}`);
                } else if (from === 'my-shelf') {
                  navigate('/my-shelf');
                } else {
                  navigate('/');
                }
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              title="回到主页"
              onClick={() => navigate('/')}
              className={`${theme === 'dark' ? 'text-gray-400 hover:text-teal-400' : 'text-gray-500 hover:text-teal-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <button
              title="目录"
              onClick={() => { setShowToc(!showToc); setShowSettings(false); }}
              className={`${theme === 'dark' ? 'text-gray-400 hover:text-teal-400' : 'text-gray-500 hover:text-teal-700'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* 中间：书名 + 主题切换 */}
          <div className="flex items-center gap-3">
            <div className={`text-sm font-bold font-serif ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              {currentBook.title}
            </div>
            <button
              title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`${theme === 'dark' ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* 右侧:笔记、全屏、设置 */}
          <div className={`flex gap-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <button
              title="笔记"
              onClick={() => {
                setToast({ message: '笔记功能开发中', type: 'info' });
              }}
              className={`${theme === 'dark' ? 'hover:text-teal-400' : 'hover:text-teal-700'}`}
            >
              <Bookmark className="w-5 h-5" />
            </button>
            <button
              title="全屏"
              onClick={toggleFullscreen}
              className={`${theme === 'dark' ? 'hover:text-teal-400' : 'hover:text-teal-700'}`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              title="设置"
              onClick={() => { setShowSettings(!showSettings); setShowToc(false); }}
              className={`${theme === 'dark' ? 'hover:text-teal-400' : 'hover:text-teal-700'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

      {/* 阅读进度条 */}
      <div className={`h-0.5 sticky z-40 ${showTopBar ? 'top-14' : 'top-0'}`}>
        <div
          className="h-full bg-teal-500 transition-all"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* 阅读设置弹窗 */}
      {showSettings && (
        <div className={`fixed top-20 right-6 rounded-lg shadow-xl p-4 z-50 w-80 ${
          theme === 'dark' ? 'bg-[#2a2a2a] border border-[#444]' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>阅读设置</h3>
            <button
              onClick={() => setShowSettings(false)}
              className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 字体大小 */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              字体大小
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`py-2 rounded text-sm ${
                    fontSize === size
                      ? 'bg-teal-600 text-white'
                      : theme === 'dark'
                      ? 'bg-[#3a3a3a] text-gray-300 hover:bg-[#4a4a4a]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size === 'small' ? '小' : size === 'medium' ? '中' : size === 'large' ? '大' : '特大'}
                </button>
              ))}
            </div>
          </div>

          {/* 字体样式 */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              字体样式
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['serif', 'sans', 'mono', 'kai', 'fangsong', 'system'] as const).map((family) => (
                <button
                  key={family}
                  onClick={() => setFontFamily(family)}
                  className={`py-2 px-1 rounded text-xs ${
                    fontFamily === family
                      ? 'bg-teal-600 text-white'
                      : theme === 'dark'
                      ? 'bg-[#3a3a3a] text-gray-300 hover:bg-[#4a4a4a]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {family === 'serif' ? '衬线' : family === 'sans' ? '无衬线' : family === 'mono' ? '等宽' : family === 'kai' ? '楷体' : family === 'fangsong' ? '仿宋' : '系统'}
                </button>
              ))}
            </div>
          </div>

          {/* 词典显示控制 */}
          <div className="mb-4 pb-4 border-b border-gray-700">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              词典显示
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEnglish}
                  onChange={(e) => setShowEnglish(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>显示英文释义</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showChinese}
                  onChange={(e) => setShowChinese(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>显示中文翻译</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 目录抽屉 */}
      {showToc && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setShowToc(false)} />
          <div className={`fixed left-0 top-0 h-full w-80 shadow-xl z-50 overflow-y-auto ${
            theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>目录</h3>
                <button
                  onClick={() => setShowToc(false)}
                  className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
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
                      navigate(buildChapterUrl(chapter.chapter_number), { replace: true });
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      index === currentChapterIndex
                        ? 'bg-teal-600 text-white font-medium'
                        : theme === 'dark'
                        ? 'hover:bg-[#3a3a3a] text-gray-300'
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
        <div className={`flex-1 flex justify-center py-12 px-8 md:px-12`}>
          <div className="w-full max-w-5xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            </div>
          ) : currentChapter ? (
            <>
              <h1 className={`${fontFamilyMap[fontFamily]} text-3xl font-bold mb-8 ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {currentChapter.title || `第 ${currentChapter.chapter_number} 章`}
              </h1>
              <div
                ref={contentRef}
                className={`${fontFamilyMap[fontFamily]} ${fontSizeMap[fontSize]} leading-loose prose prose-lg max-w-none ${
                  theme === 'dark' ? 'text-gray-300 prose-invert' : 'text-gray-800'
                }`}
                dangerouslySetInnerHTML={{ __html: currentChapter.content || '' }}
              />

              <div className={`flex justify-between items-center mt-16 pt-8 border-t ${
                theme === 'dark' ? 'border-[#333]' : 'border-[#EAE4D6]'
              }`}>
                <button
                  onClick={goToPreviousChapter}
                  disabled={currentChapterIndex === 0}
                  className={`${
                    currentChapterIndex === 0
                      ? theme === 'dark' ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                      : theme === 'dark' ? 'text-teal-400 font-medium hover:underline' : 'text-teal-700 font-medium hover:underline'
                  }`}
                >
                  上一章
                </button>

                {/* 页码显示 */}
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  第 {currentChapterIndex + 1} 章 / 共 {chapters.length} 章
                </div>

                <button
                  onClick={goToNextChapter}
                  disabled={currentChapterIndex === chapters.length - 1}
                  className={`${
                    currentChapterIndex === chapters.length - 1
                      ? theme === 'dark' ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                      : theme === 'dark' ? 'text-teal-400 font-medium hover:underline' : 'text-teal-700 font-medium hover:underline'
                  }`}
                >
                  下一章
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>暂无章节内容</p>
            </div>
          )}
          </div>
        </div>

          {/* 词典侧边栏 - 隐藏模式时不显示 */}
          {dictionaryMode === 'fixed' && (
            <div
              className={`border-l hidden lg:flex flex-col p-6 relative ${
                theme === 'dark'
                  ? 'border-[#333] bg-[#2a2a2a]'
                  : 'border-[#EAE4D6] bg-white'
              }`}
              style={{ width: `${sidebarWidth}px` }}
            >
              {/* 拖拽手柄 */}
              <div
                className={`absolute left-0 top-0 h-full w-1 cursor-col-resize group hover:bg-teal-500 transition-colors ${
                  isDragging ? 'bg-teal-500' : ''
                }`}
                onMouseDown={handleDragStart}
              >
                <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDragging ? 'opacity-100' : ''
                }`}>
                  <GripVertical className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>

              <div className="sticky top-20 flex flex-col max-h-[calc(100vh-6rem)]">
                {/* 标题和控制按钮 */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                    词典
                  </h4>
                  <div className="flex gap-1">
                    <button
                      title={dictionaryMode === 'fixed' ? '切换到悬浮模式' : '切换到固定模式'}
                      onClick={() => setDictionaryMode(dictionaryMode === 'fixed' ? 'floating' : 'fixed')}
                      className={`p-1 rounded hover:bg-opacity-20 ${
                        theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      }`}
                    >
                      {dictionaryMode === 'fixed' ? (
                        <PanelRightOpen className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <PanelRightClose className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                    <button
                      title="隐藏词典"
                      onClick={() => setDictionaryMode('hidden')}
                      className={`p-1.5 rounded-full transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
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
                          className={`font-bold font-serif capitalize break-words ${
                            theme === 'dark' ? 'text-teal-400' : 'text-teal-800'
                          }`}
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
                            <span className={`text-sm italic ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {wordDefinition.phonetic}
                            </span>
                            <button
                              onClick={() => {
                                // TODO: 实现 TTS 发音功能
                                console.log('播放发音:', wordDefinition.word);
                              }}
                              className={`p-1 rounded-full transition-colors ${
                                theme === 'dark'
                                  ? 'hover:bg-[#3a3a3a]'
                                  : 'hover:bg-gray-100'
                              }`}
                              title="点击发音（功能开发中）"
                            >
                              <Volume2 className={`w-4 h-4 ${
                                theme === 'dark'
                                  ? 'text-gray-400 hover:text-teal-400'
                                  : 'text-gray-400 hover:text-teal-600'
                              }`} />
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
                          <div key={idx} className={`mt-4 pb-3 border-b last:border-0 ${
                            theme === 'dark' ? 'border-[#444]' : 'border-gray-100'
                          }`}>
                            {meaning.partOfSpeech && (
                              <div className={`text-xs font-semibold uppercase mb-2 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                              }`}>
                                {meaning.partOfSpeech}
                                {/* 显示语言标签 */}
                                {meaning.lang && (
                                  <span className={`ml-2 px-1.5 py-0.5 text-xs font-normal rounded ${
                                    theme === 'dark'
                                      ? 'bg-[#3a3a3a] text-gray-400'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {meaning.lang === 'en' ? '英' : '中'}
                                  </span>
                                )}
                              </div>
                            )}
                            {meaning.definitions?.map((def: any, defIdx: number) => (
                              <div key={defIdx} className="mb-3 last:mb-0">
                                <p
                                  className={`leading-relaxed break-words ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}
                                  style={{
                                    fontSize: def.definition.length > 100 ? '0.8125rem' : '0.875rem'
                                  }}
                                >
                                  {defIdx + 1}. {def.definition}
                                </p>
                                {def.example && (
                                  <p
                                    className={`italic mt-1 ml-3 break-words ${
                                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`}
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
                          ? theme === 'dark'
                            ? 'bg-[#3a3a3a] border border-[#444] text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
                          : theme === 'dark'
                          ? 'border border-teal-500 text-teal-400 hover:bg-teal-500 hover:bg-opacity-10'
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
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    无法找到该内容的释义
                  </div>
                )
              ) : (
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                  <p className="mb-2">点击文章中的单词查看释义</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    或选中短语、句子进行翻译
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* 悬浮词典窗口 */}
          {dictionaryMode === 'floating' && (
            <div
              className={`fixed shadow-2xl rounded-lg overflow-hidden flex flex-col ${
                theme === 'dark' ? 'bg-[#2a2a2a] border border-[#444]' : 'bg-white border border-gray-200'
              }`}
              style={{
                left: `${floatingPosition.x}px`,
                top: `${floatingPosition.y}px`,
                width: `${floatingSize.width}px`,
                height: `${floatingSize.height}px`,
                zIndex: 50
              }}
            >
              {/* 窗口标题栏 - 可拖拽 */}
              <div
                className={`flex items-center justify-between px-4 py-2 cursor-move select-none ${
                  theme === 'dark' ? 'bg-[#1f1f1f] border-b border-[#444]' : 'bg-gray-50 border-b border-gray-200'
                }`}
                onMouseDown={handleWindowDragStart}
              >
                <h4 className={`text-sm font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  词典
                </h4>
                <div className="flex gap-1">
                  <button
                    title="固定到侧边栏"
                    onClick={() => setDictionaryMode('fixed')}
                    className={`p-1 rounded hover:bg-opacity-20 ${
                      theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                    }`}
                  >
                    <PanelRightClose className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button
                    title="隐藏词典"
                    onClick={() => setDictionaryMode('hidden')}
                    className={`p-1.5 rounded-full transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* 窗口内容区域 */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedWord ? (
                  lookupLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                    </div>
                  ) : wordDefinition ? (
                    <>
                      {/* 单词标题区域 */}
                      <div className="mb-4">
                        <div
                          className={`font-bold font-serif capitalize break-words ${
                            theme === 'dark' ? 'text-teal-400' : 'text-teal-800'
                          }`}
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
                            <span className={`text-sm italic ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {wordDefinition.phonetic}
                            </span>
                            <button
                              onClick={() => {
                                console.log('播放发音:', wordDefinition.word);
                              }}
                              className={`p-1 rounded-full transition-colors ${
                                theme === 'dark' ? 'hover:bg-[#3a3a3a]' : 'hover:bg-gray-100'
                              }`}
                              title="点击发音（功能开发中）"
                            >
                              <Volume2 className={`w-4 h-4 ${
                                theme === 'dark' ? 'text-gray-400 hover:text-teal-400' : 'text-gray-400 hover:text-teal-600'
                              }`} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 释义列表 */}
                      {wordDefinition.meanings
                        .filter((meaning: any) => {
                          const lang = meaning.lang || 'en';
                          if (lang === 'en' && !showEnglish) return false;
                          if (lang === 'zh' && !showChinese) return false;
                          return true;
                        })
                        .map((meaning: any, idx: number) => (
                          <div key={idx} className={`mt-4 pb-3 border-b last:border-0 ${
                            theme === 'dark' ? 'border-[#444]' : 'border-gray-100'
                          }`}>
                            {meaning.partOfSpeech && (
                              <div className={`text-xs font-semibold uppercase mb-2 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                              }`}>
                                {meaning.partOfSpeech}
                                {meaning.lang && (
                                  <span className={`ml-2 px-1.5 py-0.5 text-xs font-normal rounded ${
                                    theme === 'dark' ? 'bg-[#3a3a3a] text-gray-400' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {meaning.lang === 'en' ? '英' : '中'}
                                  </span>
                                )}
                              </div>
                            )}
                            {meaning.definitions?.map((def: any, defIdx: number) => (
                              <div key={defIdx} className="mb-3 last:mb-0">
                                <p
                                  className={`leading-relaxed break-words ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}
                                  style={{
                                    fontSize: def.definition.length > 100 ? '0.8125rem' : '0.875rem'
                                  }}
                                >
                                  {defIdx + 1}. {def.definition}
                                </p>
                                {def.example && (
                                  <p
                                    className={`italic mt-1 ml-3 break-words ${
                                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                    }`}
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

                      {/* 添加到生词本按钮 */}
                      <button
                        onClick={handleAddWord}
                        disabled={vocabularyStorage.has(wordDefinition.word) || wordAdded}
                        className={`w-full mt-4 py-2 rounded text-sm flex items-center justify-center gap-2 transition-all ${
                          wordAdded
                            ? 'bg-green-500 text-white'
                            : vocabularyStorage.has(wordDefinition.word)
                            ? theme === 'dark'
                              ? 'bg-[#3a3a3a] border border-[#444] text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
                            : theme === 'dark'
                            ? 'border border-teal-500 text-teal-400 hover:bg-teal-500 hover:bg-opacity-10'
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
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      无法找到该内容的释义
                    </div>
                  )
                ) : (
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                    <p className="mb-2">点击文章中的单词查看释义</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      或选中短语、句子进行翻译
                    </p>
                  </div>
                )}
              </div>

              {/* 调整大小手柄 */}
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                onMouseDown={(e) => handleResizeStart(e, 'se')}
                title="拖拽调整大小"
              >
                <div className={`absolute bottom-0 right-0 w-3 h-3 ${
                  theme === 'dark' ? 'border-r-2 border-b-2 border-gray-600' : 'border-r-2 border-b-2 border-gray-400'
                }`} />
              </div>

              {/* 上边调整手柄 */}
              <div
                className="absolute top-0 left-0 right-0 h-1 cursor-n-resize"
                onMouseDown={(e) => handleResizeStart(e, 'n')}
              />
              {/* 下边调整手柄 */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize"
                onMouseDown={(e) => handleResizeStart(e, 's')}
              />
              {/* 左边调整手柄 */}
              <div
                className="absolute top-0 bottom-0 left-0 w-1 cursor-w-resize"
                onMouseDown={(e) => handleResizeStart(e, 'w')}
              />
              {/* 右边调整手柄 */}
              <div
                className="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize"
                onMouseDown={(e) => handleResizeStart(e, 'e')}
              />

              {/* 四个角的调整手柄 */}
              <div
                className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
                onMouseDown={(e) => handleResizeStart(e, 'nw')}
              />
              <div
                className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
                onMouseDown={(e) => handleResizeStart(e, 'ne')}
              />
              <div
                className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
              />
            </div>
          )}
      </div>

      {/* 全屏模式下的退出按钮 */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg transition-all"
          title="退出全屏"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}

      {/* 显示词典按钮 - 词典隐藏时显示 */}
      {dictionaryMode === 'hidden' && (
        <button
          onClick={() => setDictionaryMode('fixed')}
          className={`fixed bottom-20 right-6 z-40 p-3 rounded-full shadow-xl transition-all ${
            theme === 'dark'
              ? 'bg-teal-600 hover:bg-teal-700 text-white'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
          title="显示词典"
        >
          <Eye className="w-5 h-5" />
        </button>
      )}
    </main>
    </>
  );
}
