import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import VocabPage from './components/VocabPage';
import ShelfPage from './components/ShelfPage';
import MyShelfPage from './components/MyShelfPage';
import BookDetailPage from './components/BookDetailPage';
import ReaderPage from './components/ReaderPage';
import UploadPage from './components/UploadPage';
import AboutPage from './components/AboutPage';
import NotFoundPage from './components/NotFoundPage';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import LearningTheoryPage from './components/LearningTheoryPage';
import VocabTestPage from './components/VocabTestPage';
import { useAuthStore } from './stores/useAuthStore';

function App() {
  const { initialize, user } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  });

  const location = useLocation();
  const isReaderPage = location.pathname === '/reader';

  // 初始化认证状态
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // 应用主题到 document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-[#F9F7F2] text-gray-800'} flex flex-col transition-colors duration-300`}>
      {/* 阅读器页面和登录页面隐藏顶部导航栏 */}
      {!isReaderPage && location.pathname !== '/login' && location.pathname !== '/auth/callback' && (
        <Navigation
          isLoggedIn={!!user}
          onToggleLogin={() => {}} // 不再需要，保留接口兼容性
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 公开路由 - 不需要登录 */}
        <Route path="/" element={<HomePage isLoggedIn={!!user} />} />
        <Route path="/shelf" element={<ShelfPage />} />
        <Route path="/my-shelf" element={<MyShelfPage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="/reader" element={<ReaderPage />} />

        {/* 需要认证的路由 - 只有用户数据相关的页面 */}
        <Route path="/vocab" element={<ProtectedRoute><VocabPage /></ProtectedRoute>} />
        <Route path="/upload" element={<UploadPage />} />

        {/* 其他路由 */}
        <Route path="/learning-theory" element={<LearningTheoryPage />} />
        <Route path="/vocab-test" element={<VocabTestPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
