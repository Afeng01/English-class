import { vocabularyStorage, progressStorage, settingsStorage } from './storage'
import { vocabularyService, progressService, settingsService } from './supabaseService'

// 迁移状态标记
const MIGRATION_KEY = 'data_migrated'

/**
 * 检查是否已经完成迁移
 */
export const isMigrated = (): boolean => {
  return localStorage.getItem(MIGRATION_KEY) === 'true'
}

/**
 * 标记迁移已完成
 */
export const markMigrated = (): void => {
  localStorage.setItem(MIGRATION_KEY, 'true')
}

/**
 * 清除迁移标记（用于退出登录）
 */
export const clearMigrationMark = (): void => {
  localStorage.removeItem(MIGRATION_KEY)
}

/**
 * 执行数据迁移
 * @returns 迁移结果统计
 */
export const migrateLocalData = async (): Promise<{
  vocabularyMigrated: number
  progressMigrated: number
  settingsMigrated: boolean
  success: boolean
  error?: string
}> => {
  // 如果已经迁移过，直接返回
  if (isMigrated()) {
    console.log('数据已迁移，跳过')
    return {
      vocabularyMigrated: 0,
      progressMigrated: 0,
      settingsMigrated: false,
      success: true,
    }
  }

  console.log('开始迁移localStorage数据到Supabase...')

  const result = {
    vocabularyMigrated: 0,
    progressMigrated: 0,
    settingsMigrated: false,
    success: false,
    error: undefined as string | undefined,
  }

  try {
    // 1. 迁移词汇数据
    const localVocabulary = vocabularyStorage.getAll()
    if (localVocabulary.length > 0) {
      console.log(`发现 ${localVocabulary.length} 个本地词汇，开始迁移...`)
      result.vocabularyMigrated = await vocabularyService.bulkAdd(localVocabulary)
      console.log(`成功迁移 ${result.vocabularyMigrated} 个词汇`)
    }

    // 2. 迁移阅读进度
    const localProgress = progressStorage.getAll()
    const progressCount = Object.keys(localProgress).length
    if (progressCount > 0) {
      console.log(`发现 ${progressCount} 个本地阅读进度，开始迁移...`)
      result.progressMigrated = await progressService.bulkSave(localProgress)
      console.log(`成功迁移 ${result.progressMigrated} 个阅读进度`)
    }

    // 3. 迁移设置
    const localSettings = settingsStorage.get()
    const defaultSettings = {
      font_size: 'medium' as const,
      line_height: 1.8,
      theme: 'light' as const,
      translationPriority: 'english' as const,
    }

    // 检查设置是否与默认值不同
    const hasCustomSettings =
      localSettings.font_size !== defaultSettings.font_size ||
      localSettings.line_height !== defaultSettings.line_height ||
      localSettings.theme !== defaultSettings.theme ||
      localSettings.translationPriority !== defaultSettings.translationPriority

    if (hasCustomSettings) {
      console.log('发现自定义设置，开始迁移...')
      result.settingsMigrated = await settingsService.save(localSettings)
      console.log('设置迁移完成')
    }

    // 4. 标记迁移已完成
    markMigrated()
    result.success = true

    console.log('数据迁移完成！', result)
  } catch (error: any) {
    console.error('数据迁移失败:', error)
    result.error = error.message || '未知错误'
    result.success = false
  }

  return result
}

/**
 * 在用户登录后自动执行迁移
 * 这个函数应该在认证状态变化后调用
 */
export const autoMigrateOnLogin = async (): Promise<void> => {
  // 检查是否已迁移
  if (isMigrated()) {
    console.log('数据已迁移，无需重复迁移')
    return
  }

  // 检查是否有本地数据
  const hasLocalData =
    vocabularyStorage.getAll().length > 0 ||
    Object.keys(progressStorage.getAll()).length > 0

  if (!hasLocalData) {
    console.log('没有本地数据需要迁移')
    markMigrated() // 即使没有数据也标记已迁移，避免后续重复检查
    return
  }

  console.log('检测到本地数据，开始自动迁移...')

  const result = await migrateLocalData()

  if (result.success) {
    const totalMigrated = result.vocabularyMigrated + result.progressMigrated
    if (totalMigrated > 0 || result.settingsMigrated) {
      console.log(
        `✅ 数据迁移成功！\n` +
          `词汇：${result.vocabularyMigrated} 个\n` +
          `阅读进度：${result.progressMigrated} 个\n` +
          `设置：${result.settingsMigrated ? '已迁移' : '未迁移'}`
      )
    }
  } else {
    console.error('❌ 数据迁移失败:', result.error)
  }
}
