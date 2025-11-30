import { create } from 'zustand';
import type { Book, UserVocabulary, ReaderSettings } from '../types';
import { vocabularyService, settingsService } from '../services/supabaseService';
import { vocabularyStorage, settingsStorage } from '../services/storage';

interface AppStore {
  // 当前选中的书籍
  currentBook: Book | null;
  setCurrentBook: (book: Book | null) => void;

  // 用户词汇库
  vocabulary: UserVocabulary[];
  vocabularyLoading: boolean;
  loadVocabulary: () => Promise<void>;
  addWord: (word: Omit<UserVocabulary, 'added_at'>) => Promise<boolean>;
  removeWord: (word: string) => Promise<boolean>;
  updateWordStatus: (word: string, status: 'learning' | 'mastered') => Promise<boolean>;

  // 阅读器设置
  settings: ReaderSettings;
  settingsLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentBook: null,
  setCurrentBook: (book) => set({ currentBook: book }),

  vocabulary: [],
  vocabularyLoading: false,
  loadVocabulary: async () => {
    set({ vocabularyLoading: true });
    try {
      // 尝试从Supabase加载
      const vocab = await vocabularyService.getAll();
      set({ vocabulary: vocab, vocabularyLoading: false });
    } catch (error) {
      console.error('加载词汇失败，使用localStorage:', error);
      // 降级到localStorage
      const vocab = vocabularyStorage.getAll();
      set({ vocabulary: vocab, vocabularyLoading: false });
    }
  },
  addWord: async (word) => {
    try {
      // 尝试添加到Supabase
      const success = await vocabularyService.add(word);
      if (success) {
        await get().loadVocabulary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('添加词汇失败，使用localStorage:', error);
      // 降级到localStorage
      vocabularyStorage.add(word);
      await get().loadVocabulary();
      return true;
    }
  },
  removeWord: async (word) => {
    try {
      // 尝试从Supabase删除
      const success = await vocabularyService.remove(word);
      if (success) {
        await get().loadVocabulary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除词汇失败，使用localStorage:', error);
      // 降级到localStorage
      vocabularyStorage.remove(word);
      await get().loadVocabulary();
      return true;
    }
  },
  updateWordStatus: async (word, status) => {
    try {
      // 尝试在Supabase更新
      const success = await vocabularyService.updateStatus(word, status);
      if (success) {
        await get().loadVocabulary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('更新词汇状态失败，使用localStorage:', error);
      // 降级到localStorage
      vocabularyStorage.updateStatus(word, status);
      await get().loadVocabulary();
      return true;
    }
  },

  settings: {
    font_size: 'medium',
    line_height: 1.8,
    theme: 'light',
    translationPriority: 'english',
  },
  settingsLoading: false,
  loadSettings: async () => {
    set({ settingsLoading: true });
    try {
      // 尝试从Supabase加载
      const settings = await settingsService.get();
      set({ settings, settingsLoading: false });
    } catch (error) {
      console.error('加载设置失败，使用localStorage:', error);
      // 降级到localStorage
      const settings = settingsStorage.get();
      set({ settings, settingsLoading: false });
    }
  },
  updateSetting: async (key, value) => {
    try {
      // 先更新本地状态以提供即时反馈
      const currentSettings = get().settings;
      set({
        settings: {
          ...currentSettings,
          [key]: value,
        },
      });

      // 尝试在Supabase更新
      await settingsService.update(key, value);
    } catch (error) {
      console.error('更新设置失败，使用localStorage:', error);
      // 降级到localStorage
      settingsStorage.update(key, value);
      await get().loadSettings();
    }
  },
}));
