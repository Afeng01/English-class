import type { UserVocabulary, ReadingProgress, ReaderSettings } from '../types';

// 本地存储键
const STORAGE_KEYS = {
  VOCABULARY: 'english_reading_vocabulary',
  PROGRESS: 'english_reading_progress',
  SETTINGS: 'english_reading_settings',
};

// 词汇库管理
export const vocabularyStorage = {
  // 获取所有词汇
  getAll: (): UserVocabulary[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VOCABULARY);
    return data ? JSON.parse(data) : [];
  },

  // 添加词汇
  add: (vocab: Omit<UserVocabulary, 'added_at'>): void => {
    const all = vocabularyStorage.getAll();
    const exists = all.find(v => v.word === vocab.word);

    if (!exists) {
      all.push({
        ...vocab,
        added_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(all));
    }
  },

  // 删除词汇
  remove: (word: string): void => {
    const all = vocabularyStorage.getAll();
    const filtered = all.filter(v => v.word !== word);
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(filtered));
  },

  // 更新词汇状态
  updateStatus: (word: string, status: 'learning' | 'mastered'): void => {
    const all = vocabularyStorage.getAll();
    const updated = all.map(v =>
      v.word === word ? { ...v, status } : v
    );
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(updated));
  },

  // 检查是否已存在
  has: (word: string): boolean => {
    return vocabularyStorage.getAll().some(v => v.word === word);
  },
};

// 阅读进度管理
export const progressStorage = {
  // 获取所有进度
  getAll: (): Record<string, ReadingProgress> => {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : {};
  },

  // 获取指定书籍进度
  get: (bookId: string): ReadingProgress | null => {
    const all = progressStorage.getAll();
    return all[bookId] || null;
  },

  // 保存进度
  save: (progress: ReadingProgress): void => {
    const all = progressStorage.getAll();
    all[progress.book_id] = {
      ...progress,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
  },

  // 删除进度
  remove: (bookId: string): void => {
    const all = progressStorage.getAll();
    delete all[bookId];
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
  },
};

// 阅读器设置管理
export const settingsStorage = {
  // 获取设置
  get: (): ReaderSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      font_size: 'medium',
      line_height: 1.8,
      theme: 'light',
    };
  },

  // 保存设置
  save: (settings: ReaderSettings): void => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // 更新单个设置
  update: (key: keyof ReaderSettings, value: any): void => {
    const settings = settingsStorage.get();
    settings[key] = value;
    settingsStorage.save(settings);
  },
};
