import { create } from 'zustand';
import type { Book, UserVocabulary, ReaderSettings } from '../types';
import { vocabularyStorage, settingsStorage } from '../services/storage';

interface AppStore {
  // 当前选中的书籍
  currentBook: Book | null;
  setCurrentBook: (book: Book | null) => void;

  // 用户词汇库
  vocabulary: UserVocabulary[];
  loadVocabulary: () => void;
  addWord: (word: Omit<UserVocabulary, 'added_at'>) => void;
  removeWord: (word: string) => void;
  updateWordStatus: (word: string, status: 'learning' | 'mastered') => void;

  // 阅读器设置
  settings: ReaderSettings;
  loadSettings: () => void;
  updateSetting: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentBook: null,
  setCurrentBook: (book) => set({ currentBook: book }),

  vocabulary: [],
  loadVocabulary: () => {
    const vocab = vocabularyStorage.getAll();
    set({ vocabulary: vocab });
  },
  addWord: (word) => {
    vocabularyStorage.add(word);
    get().loadVocabulary();
  },
  removeWord: (word) => {
    vocabularyStorage.remove(word);
    get().loadVocabulary();
  },
  updateWordStatus: (word, status) => {
    vocabularyStorage.updateStatus(word, status);
    get().loadVocabulary();
  },

  settings: {
    font_size: 'medium',
    line_height: 1.8,
    theme: 'light',
  },
  loadSettings: () => {
    const settings = settingsStorage.get();
    set({ settings });
  },
  updateSetting: (key, value) => {
    settingsStorage.update(key, value);
    get().loadSettings();
  },
}));
