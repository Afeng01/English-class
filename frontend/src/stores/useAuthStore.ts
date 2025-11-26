import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { autoMigrateOnLogin, clearMigrationMark } from '../services/dataMigration'

interface AuthStore {
  user: User | null
  session: Session | null
  loading: boolean

  initialize: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    // 获取当前会话
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, loading: false })

    // 如果用户已登录，触发自动迁移
    if (session?.user) {
      // 异步执行迁移，不阻塞初始化
      autoMigrateOnLogin().catch(error => {
        console.error('自动迁移失败:', error)
      })
    }

    // 监听认证状态变化
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const previousUser = useAuthStore.getState().user
      set({ session, user: session?.user ?? null })

      // 如果从未登录变为已登录，触发数据迁移
      if (!previousUser && session?.user) {
        console.log('检测到新登录，触发数据迁移')
        try {
          await autoMigrateOnLogin()
        } catch (error) {
          console.error('登录后数据迁移失败:', error)
        }
      }
    })
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Google 登录失败:', error.message)
      alert(`登录失败: ${error.message}`)
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
    // 清除迁移标记，以便下次登录时重新迁移
    clearMigrationMark()
  },
}))
