import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthStore()

  // 加载中显示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录重定向到登录页
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 已登录，显示内容
  return <>{children}</>
}
