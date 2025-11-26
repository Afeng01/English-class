import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { initialize } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      // 重新初始化认证状态
      await initialize()

      // 等待一小段时间确保用户状态已更新
      setTimeout(() => {
        // 跳转到首页
        navigate('/', { replace: true })
      }, 500)
    }

    handleCallback()
  }, [initialize, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在登录...</p>
      </div>
    </div>
  )
}
