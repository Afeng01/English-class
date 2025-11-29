// 书籍类型
export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  level?: string;
  lexile?: string; // 蓝思值，如 "200L", "450L", "1000L"
  word_count: number;
  description?: string;
  epub_path?: string;
  created_at: string;
  category?: 'fiction' | 'non-fiction'; // 分类：虚构类 | 非虚构类
  series?: string; // 系列，如 "Magic Tree House"
}

// 章节类型
export interface Chapter {
  id: string;
  chapter_number: number;
  title?: string;
  content?: string;
  word_count: number;
}

// 书籍详情（包含章节）
export interface BookDetail extends Book {
  chapters: Chapter[];
}

// 词汇类型
export interface Vocabulary {
  id: string;
  word: string;
  frequency: number;
  phonetic?: string;
  definition?: string;
}

// 词典查询结果
export interface DictionaryResult {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
    }[];
  }[];
  audio?: string;
  searched_word?: string;  // 用户查询的原词（词形变化）
  lemma?: string;  // 还原后的词根
}

// 本地词汇库
export interface UserVocabulary {
  word: string;
  phonetic?: string;
  definition?: string;
  status: 'learning' | 'mastered';
  added_at: string;
  source_book_id?: string;
}

// 阅读进度
export interface ReadingProgress {
  book_id: string;
  chapter_number: number;
  position: number;
  updated_at: string;
}

// 阅读器设置
export interface ReaderSettings {
  font_size: 'small' | 'medium' | 'large' | 'xlarge';
  line_height: number;
  theme: 'light' | 'dark' | 'sepia';
}

// 难度等级选项
export const LEVELS = [
  '学前',
  '一年级',
  '二年级',
  '三年级',
  '四年级',
  '五年级',
  '六年级',
  '初一',
  '初二',
  '初三',
  '高一',
  '高二',
  '高三',
] as const;

export type Level = typeof LEVELS[number];

// 管理员备份/删除 API 类型
export interface AdminBackupItem {
  book_id: string;
  backup_path: string;
  backup_size: number;
}

export interface AdminBackupFailure {
  book_id: string;
  reason: string;
}

export interface AdminBackupResponse {
  success: boolean;
  backups: AdminBackupItem[];
  failed: AdminBackupFailure[];
}

export interface AdminDeleteFailure {
  book_id: string;
  reason: string;
}

export interface AdminDeleteResponse {
  success: boolean;
  deleted: string[];
  failed: AdminDeleteFailure[];
  backups?: AdminBackupItem[];
}
