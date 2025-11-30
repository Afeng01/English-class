import { supabase } from '../lib/supabase'
import type { UserVocabulary, ReadingProgress, ReaderSettings } from '../types'

// Supabase数据库类型定义
interface DbUserVocabulary {
  id: string
  user_id: string
  word: string
  phonetic: string | null
  definition: string | null
  status: 'learning' | 'mastered'
  source_book_id: string | null
  added_at: string
  updated_at: string
}

interface DbReadingProgress {
  id: string
  user_id: string
  book_id: string
  chapter_number: number
  position: number
  updated_at: string
}

interface DbUserSettings {
  user_id: string
  font_size: 'small' | 'medium' | 'large' | 'xlarge'
  line_height: number
  theme: 'light' | 'dark' | 'sepia'
  translation_priority?: 'english' | 'chinese'
  updated_at: string
}

// 词汇库管理
export const vocabularyService = {
  // 获取所有词汇
  getAll: async (): Promise<UserVocabulary[]> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('获取词汇失败:', error)
      return []
    }

    return (data as DbUserVocabulary[]).map(item => ({
      word: item.word,
      phonetic: item.phonetic || undefined,
      definition: item.definition || undefined,
      status: item.status,
      added_at: item.added_at,
      source_book_id: item.source_book_id || undefined,
    }))
  },

  // 添加词汇
  add: async (vocab: Omit<UserVocabulary, 'added_at'>): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('user_vocabulary')
      .select('id')
      .eq('user_id', user.id)
      .eq('word', vocab.word)
      .single()

    if (existing) {
      console.log('词汇已存在:', vocab.word)
      return false
    }

    const { error } = await supabase
      .from('user_vocabulary')
      .insert({
        user_id: user.id,
        word: vocab.word,
        phonetic: vocab.phonetic || null,
        definition: vocab.definition || null,
        status: vocab.status,
        source_book_id: vocab.source_book_id || null,
      })

    if (error) {
      console.error('添加词汇失败:', error)
      return false
    }

    return true
  },

  // 删除词汇
  remove: async (word: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('user_vocabulary')
      .delete()
      .eq('user_id', user.id)
      .eq('word', word)

    if (error) {
      console.error('删除词汇失败:', error)
      return false
    }

    return true
  },

  // 更新词汇状态
  updateStatus: async (word: string, status: 'learning' | 'mastered'): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('user_vocabulary')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('word', word)

    if (error) {
      console.error('更新词汇状态失败:', error)
      return false
    }

    return true
  },

  // 检查是否已存在
  has: async (word: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from('user_vocabulary')
      .select('id')
      .eq('user_id', user.id)
      .eq('word', word)
      .single()

    return !!data
  },

  // 批量添加词汇（用于迁移）
  bulkAdd: async (vocabList: UserVocabulary[]): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    // 先获取已存在的词汇
    const { data: existing } = await supabase
      .from('user_vocabulary')
      .select('word')
      .eq('user_id', user.id)

    const existingWords = new Set(existing?.map(v => v.word) || [])

    // 过滤掉已存在的词汇
    const newVocab = vocabList
      .filter(v => !existingWords.has(v.word))
      .map(v => ({
        user_id: user.id,
        word: v.word,
        phonetic: v.phonetic || null,
        definition: v.definition || null,
        status: v.status,
        source_book_id: v.source_book_id || null,
        added_at: v.added_at,
      }))

    if (newVocab.length === 0) return 0

    const { data, error } = await supabase
      .from('user_vocabulary')
      .insert(newVocab)
      .select()

    if (error) {
      console.error('批量添加词汇失败:', error)
      return 0
    }

    return data?.length || 0
  },
}

// 阅读进度管理
export const progressService = {
  // 获取所有进度
  getAll: async (): Promise<Record<string, ReadingProgress>> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data, error } = await supabase
      .from('user_reading_progress')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('获取阅读进度失败:', error)
      return {}
    }

    const progressMap: Record<string, ReadingProgress> = {}
    ;(data as DbReadingProgress[]).forEach(item => {
      progressMap[item.book_id] = {
        book_id: item.book_id,
        chapter_number: item.chapter_number,
        position: item.position,
        updated_at: item.updated_at,
      }
    })

    return progressMap
  },

  // 获取指定书籍进度
  get: async (bookId: string): Promise<ReadingProgress | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_reading_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 未找到记录
        return null
      }
      console.error('获取阅读进度失败:', error)
      return null
    }

    const item = data as DbReadingProgress
    return {
      book_id: item.book_id,
      chapter_number: item.chapter_number,
      position: item.position,
      updated_at: item.updated_at,
    }
  },

  // 保存进度
  save: async (progress: ReadingProgress): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('user_reading_progress')
      .upsert({
        user_id: user.id,
        book_id: progress.book_id,
        chapter_number: progress.chapter_number,
        position: progress.position,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('保存阅读进度失败:', error)
      return false
    }

    return true
  },

  // 删除进度
  remove: async (bookId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('user_reading_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId)

    if (error) {
      console.error('删除阅读进度失败:', error)
      return false
    }

    return true
  },

  // 批量保存进度（用于迁移）
  bulkSave: async (progressMap: Record<string, ReadingProgress>): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const progressList = Object.values(progressMap).map(p => ({
      user_id: user.id,
      book_id: p.book_id,
      chapter_number: p.chapter_number,
      position: p.position,
      updated_at: p.updated_at,
    }))

    if (progressList.length === 0) return 0

    const { data, error } = await supabase
      .from('user_reading_progress')
      .upsert(progressList)
      .select()

    if (error) {
      console.error('批量保存阅读进度失败:', error)
      return 0
    }

    return data?.length || 0
  },
}

// 阅读器设置管理
export const settingsService = {
  // 获取设置
  get: async (): Promise<ReaderSettings> => {
    const { data: { user } } = await supabase.auth.getUser()

    const defaultSettings: ReaderSettings = {
      font_size: 'medium',
      line_height: 1.8,
      theme: 'light',
      translationPriority: 'english',
    }

    if (!user) return defaultSettings

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 未找到记录，返回默认设置
        return defaultSettings
      }
      console.error('获取设置失败:', error)
      return defaultSettings
    }

    const item = data as DbUserSettings
    return {
      font_size: item.font_size,
      line_height: item.line_height,
      theme: item.theme,
      translationPriority: item.translation_priority || defaultSettings.translationPriority,
    }
  },

  // 保存设置
  save: async (settings: ReaderSettings): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        font_size: settings.font_size,
        line_height: settings.line_height,
        theme: settings.theme,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('保存设置失败:', error)
      return false
    }

    return true
  },

  // 更新单个设置
  update: async <K extends keyof ReaderSettings>(
    key: K,
    value: ReaderSettings[K]
  ): Promise<boolean> => {
    const settings = await settingsService.get()
    settings[key] = value
    return await settingsService.save(settings)
  },
}
