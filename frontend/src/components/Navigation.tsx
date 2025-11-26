import { useState, useEffect } from 'react';
import { Book, Brain, User, Sun, Moon, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

interface NavigationProps {
  isLoggedIn: boolean;
  onToggleLogin: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Navigation({ isLoggedIn, onToggleLogin, theme, onToggleTheme }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const currentPath = location.pathname;
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 如果滚动距离小于 50px，始终显示导航栏
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else {
        // 向下滚动隐藏，向上滚动显示
        setIsVisible(currentScrollY < lastScrollY);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={`w-full px-8 py-4 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-50 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <Link
        to="/"
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
      >
        <Book className="w-8 h-8 text-teal-700" />
        <span className="text-xl font-bold tracking-wide text-teal-900">EnglishAcquire</span>
      </Link>

      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-100 px-5 py-2.5 rounded-full shadow-inner">
        <a
          href="https://github.com/your-repo"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-black text-gray-500 transition-colors"
          title="GitHub"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
        <div className="w-px h-4 bg-gray-300"></div>
        <button
          onClick={onToggleTheme}
          className="hover:text-amber-600 text-gray-500 transition-colors"
          title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>
        <div className="w-px h-4 bg-gray-300"></div>
        <button
          onClick={() => navigate('/about')}
          className="hover:text-teal-600 text-gray-500 transition-colors"
          title="联系我们"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
        <Link
          to="/shelf"
          className={`flex items-center gap-1 ${
            currentPath === '/shelf' ? 'text-teal-700 font-bold' : 'hover:text-teal-700'
          }`}
        >
          <Book className="w-4 h-4" /> 书架
        </Link>
        <Link
          to="/vocab"
          className={`flex items-center gap-1 ${
            currentPath === '/vocab' ? 'text-teal-700 font-bold' : 'hover:text-teal-700'
          }`}
        >
          <Brain className="w-4 h-4" /> 词库
        </Link>

        {/* 用户菜单 */}
        {isLoggedIn && user ? (
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-teal-500 overflow-hidden"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={user.email || '用户'}
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="用户头像"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            {/* 下拉菜单 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setShowUserMenu(false);
                    navigate('/');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            登录
          </button>
        )}
      </div>
    </nav>
  );
}
