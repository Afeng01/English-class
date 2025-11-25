import { Book, Brain, User } from 'lucide-react';

type Page = 'home' | 'shelf' | 'vocab' | 'reader';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isLoggedIn: boolean;
  onToggleLogin: () => void;
}

export default function Navigation({ currentPage, onNavigate, isLoggedIn, onToggleLogin }: NavigationProps) {
  return (
    <nav className="w-full px-8 py-4 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-50">
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        onClick={() => onNavigate('home')}
      >
        <Book className="w-8 h-8 text-teal-700" />
        <span className="text-xl font-bold tracking-wide text-teal-900">EnglishAcquire</span>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-100 px-5 py-2.5 rounded-full shadow-inner">
        <a
          href="https://github.com"
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
        <button className="hover:text-amber-600 text-gray-500 transition-colors" title="切换背景">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </button>
        <div className="w-px h-4 bg-gray-300"></div>
        <button className="hover:text-teal-600 text-gray-500 transition-colors" title="切换语言">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
        <button
          onClick={() => onNavigate('shelf')}
          className={`flex items-center gap-1 ${
            currentPage === 'shelf' ? 'text-teal-700 font-bold' : 'hover:text-teal-700'
          }`}
        >
          <Book className="w-4 h-4" /> 书架
        </button>
        <button
          onClick={() => onNavigate('vocab')}
          className={`flex items-center gap-1 ${
            currentPage === 'vocab' ? 'text-teal-700 font-bold' : 'hover:text-teal-700'
          }`}
        >
          <Brain className="w-4 h-4" /> 词库
        </button>

        <div
          className={`w-8 h-8 rounded-full ${isLoggedIn ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'} flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-teal-500`}
          onClick={onToggleLogin}
          title="点击切换登录状态 (演示用)"
        >
          <User className="w-4 h-4" />
        </div>
      </div>
    </nav>
  );
}
