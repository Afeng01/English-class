import axios from 'axios';
import type { Book, BookDetail, Chapter, Vocabulary, DictionaryResult } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 上传响应类型
interface UploadResponse {
  success: boolean;
  message: string;
  book: {
    id: string;
    title: string;
    author: string;
    level: string;
    word_count: number;
    chapter_count: number;
  };
}

// 书籍相关 API
export const booksAPI = {
  // 获取书籍列表
  getBooks: (params?: { level?: string; search?: string }) =>
    api.get<Book[]>('/books', { params }),

  // 获取书籍详情
  getBook: (id: string) =>
    api.get<BookDetail>(`/books/${id}`),

  // 获取书籍章节列表
  getChapters: (bookId: string) =>
    api.get<Chapter[]>(`/books/${bookId}/chapters`),

  // 获取指定章节内容
  getChapter: (bookId: string, chapterNumber: number) =>
    api.get<Chapter>(`/books/${bookId}/chapters/${chapterNumber}`),

  // 获取书籍高频词汇
  getVocabulary: (bookId: string, limit = 50) =>
    api.get<Vocabulary[]>(`/books/${bookId}/vocabulary`, { params: { limit } }),

  // 获取难度等级选项
  getLevelOptions: () =>
    api.get<{ levels: string[] }>('/books/levels/options'),

  // 上传书籍
  uploadBook: (file: File, level: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('level', level);
    return api.post<UploadResponse>('/books/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 上传可能需要更长时间
    });
  },

  // 删除书籍
  deleteBook: (bookId: string) =>
    api.delete(`/books/${bookId}`),
};

// 词典相关 API
export const dictionaryAPI = {
  // 查询单词
  lookup: (word: string) =>
    api.get<DictionaryResult>(`/dictionary/${word}`),
};

export default api;
