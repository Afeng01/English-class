import { useState, useEffect } from 'react';
import { ArrowLeft, Type, List, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { booksAPI, dictionaryAPI } from '../services/api';
import { progressStorage, vocabularyStorage } from '../services/storage';
import type { Chapter, DictionaryResult } from '../types';

type Page = 'home' | 'shelf' | 'vocab' | 'reader';

interface ReaderPageProps {
  onNavigate: (page: Page) => void;
}

export default function ReaderPage({ onNavigate }: ReaderPageProps) {
  const currentBook = useAppStore(state => state.currentBook);
  const addWord = useAppStore(state => state.addWord);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDefinition, setWordDefinition] = useState<DictionaryResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // 加载章节列表
  useEffect(() => {
    if (!currentBook) return;

    const loadChapters = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await booksAPI.getChapters(currentBook.id);
        setChapters(response.data);

        // 从本地存储获取阅读进度
        const progress = progressStorage.get(currentBook.id);
        const chapterIndex = progress ? progress.chapter_number - 1 : 0;
        setCurrentChapterIndex(chapterIndex);
      } catch (err) {
        console.error('Failed to load chapters:', err);
        setError('无法加载章节列表');
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, [currentBook]);

  // 加载当前章节内容
  useEffect(() => {
    if (!currentBook || chapters.length === 0) return;

    const loadChapter = async () => {
      try {
        setLoading(true);
        setError(null);
        const chapterNumber = chapters[currentChapterIndex].chapter_number;
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

  // 查询单词释义
  useEffect(() => {
    if (!selectedWord) {
      setWordDefinition(null);
      return;
    }

    const lookupWord = async () => {
      try {
        setLookupLoading(true);
        const response = await dictionaryAPI.lookup(selectedWord);
        setWordDefinition(response.data);
      } catch (err) {
        console.error('Failed to lookup word:', err);
        setWordDefinition(null);
      } finally {
        setLookupLoading(false);
      }
    };

    lookupWord();
  }, [selectedWord]);

  // 处理单词点击
  const handleWordClick = (word: string) => {
    // 清理单词：移除标点符号，转为小写
    const cleanWord = word.replace(/[.,!?;:()"\[\]]/g, '').toLowerCase();
    if (cleanWord) {
      setSelectedWord(cleanWord);
    }
  };

  // 添加到生词本
  const handleAddWord = () => {
    if (!wordDefinition) return;

    const definition = wordDefinition.meanings[0]?.definitions?.[0]?.definition || '';
    addWord({
      word: wordDefinition.word,
      phonetic: wordDefinition.phonetic,
      definition,
      status: 'learning',
    });
  };

  // 章节导航
  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      setSelectedWord(null);
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setSelectedWord(null);
    }
  };

  // 如果没有选中书籍，显示提示
  if (!currentBook) {
    return (
      <main className="flex-grow flex flex-col items-center justify-center bg-[#FDFBF7]">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-600">请先选择一本书籍</p>
        <button
          onClick={() => onNavigate('shelf')}
          className="mt-4 px-6 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
        >
          前往书架
        </button>
      </main>
    );
  }

  return (
    <main className="flex-grow flex flex-col bg-[#FDFBF7]">
      <div className="h-14 border-b border-[#EAE4D6] flex items-center justify-between px-6 bg-[#FDFBF7] sticky top-0 z-40">
        <button
          className="text-gray-500 hover:text-teal-700 flex items-center gap-1"
          onClick={() => onNavigate('home')}
        >
          <ArrowLeft className="w-4 h-4" /> <span className="text-sm">返回</span>
        </button>
        <div className="text-sm font-bold text-gray-700 font-serif">{currentBook.title}</div>
        <div className="flex gap-3 text-gray-500">
          <button title="字体设置">
            <Type className="w-5 h-5" />
          </button>
          <button title="目录">
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

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
              <div className="font-serif text-lg leading-loose text-gray-800 space-y-6">
                {currentChapter.content?.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>
                    {paragraph.split(' ').map((word, wordIdx) => (
                      <span
                        key={wordIdx}
                        className={`${
                          word.replace(/[.,!?;:()"\[\]]/g, '').toLowerCase() === selectedWord
                            ? 'bg-yellow-200'
                            : 'hover:bg-yellow-50'
                        } cursor-pointer transition-colors`}
                        onClick={() => handleWordClick(word)}
                      >
                        {word}{' '}
                      </span>
                    ))}
                  </p>
                ))}
              </div>

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
          <div className="sticky top-20">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Selected Word</h4>
            {selectedWord ? (
              lookupLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                </div>
              ) : wordDefinition ? (
                <>
                  <div className="mb-6">
                    <div className="text-2xl font-bold text-teal-800 font-serif capitalize">
                      {wordDefinition.word}
                    </div>
                    {wordDefinition.phonetic && (
                      <div className="text-sm text-gray-500 italic mt-1">{wordDefinition.phonetic}</div>
                    )}
                    {wordDefinition.meanings.map((meaning, idx) => (
                      <div key={idx} className="mt-3">
                        {meaning.partOfSpeech && (
                          <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                            {meaning.partOfSpeech}
                          </div>
                        )}
                        {meaning.definitions?.slice(0, 2).map((def, defIdx) => (
                          <div key={defIdx} className="mb-2">
                            <p className="text-sm text-gray-700">{def.definition}</p>
                            {def.example && (
                              <p className="text-xs text-gray-500 italic mt-1">&ldquo;{def.example}&rdquo;</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddWord}
                    disabled={vocabularyStorage.has(wordDefinition.word)}
                    className={`w-full py-2 rounded text-sm flex items-center justify-center gap-2 ${
                      vocabularyStorage.has(wordDefinition.word)
                        ? 'border border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border border-teal-600 text-teal-600 hover:bg-teal-50'
                    }`}
                  >
                    <Plus className="w-4 h-4" />{' '}
                    {vocabularyStorage.has(wordDefinition.word) ? '已在生词本' : '加入生词本'}
                  </button>
                </>
              ) : (
                <div className="text-sm text-gray-500">无法找到该单词的释义</div>
              )
            ) : (
              <div className="text-sm text-gray-400">点击文章中的单词查看释义</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
