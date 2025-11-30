// 难度等级常量
export const LEVELS = [
  "学前", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
  "初一", "初二", "初三", "高一", "高二", "高三"
];

// 书籍基础信息
export interface Book {
  id: string;
  title: string;
  author?: string;
  level?: string;
  description?: string;
  cover?: string;
  word_count: number;
  epub_path?: string;
  created_at: string;
  series?: string;
  lexile?: string;
  category?: 'fiction' | 'non-fiction';
}

// 章节信息
export interface Chapter {
  id: string;
  chapter_number: number;
  title?: string;
  content?: string;
  word_count: number;
}

// 词汇信息
export interface Vocabulary {
  id: string;
  word: string;
  frequency: number;
  phonetic?: string;
  definition?: string;
}

// 书籍详情（包含章节列表）
export interface BookDetail extends Book {
  chapters: Chapter[];
}

// 词典查询结果
export interface DictionaryResult {
  word: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech?: string;
    definitions?: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
  audio?: string;
  searched_word?: string;  // 用户查询的原词（词形变化）
  lemma?: string;  // 还原后的词根
}

// 用户词汇库
export interface UserVocabulary {
  word: string;
  phonetic?: string;
  definition?: string;
  status: 'learning' | 'mastered';
  added_at: string;
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
  translationPriority: 'english' | 'chinese';
}
