import { useEffect, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  logo?: ReactNode;
  links?: Array<{
    label: string;
    path: string;
    icon?: ReactNode;
  }>;
}

export function Navigation({ logo, links = [], className = '', ...props }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { settings, updateSetting } = useAppStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 同步主题到 document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSetting('theme', newTheme);
  };

  return (
    <nav
      className={`
        sticky top-0 z-[var(--z-sticky)]
        transition-all duration-[var(--duration-base)] ease-[var(--ease-out)]
        ${
          scrolled
            ? 'glass backdrop-blur-xl shadow-sm h-14'
            : 'bg-transparent h-16'
        }
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="
            text-xl font-bold text-[var(--color-text)]
            hover:text-[var(--color-primary)]
            transition-colors duration-[var(--duration-fast)]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--color-primary)]
            rounded-lg px-2 py-1 -mx-2
          "
        >
          {logo || '英语分级阅读'}
        </button>

        {/* Links & Theme Toggle */}
        <div className="flex items-center gap-1">
          {links.length > 0 && links.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`
                relative
                flex items-center gap-2
                px-4 py-2 rounded-lg
                font-medium text-sm
                transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[var(--color-primary)]
                ${
                  isActive(link.path)
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]'
                }
              `
                .trim()
                .replace(/\s+/g, ' ')}
            >
              {link.icon && <span className="inline-flex">{link.icon}</span>}
              <span>{link.label}</span>

              {/* Active Indicator - 苹果式下划线 */}
              {isActive(link.path) && (
                <span
                  className="
                    absolute bottom-0 left-1/2 -translate-x-1/2
                    w-1/2 h-0.5 rounded-full
                    bg-[var(--color-primary)]
                    animate-scale-in
                  "
                />
              )}
            </button>
          ))}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="
              ml-2 p-2 rounded-lg
              text-[var(--color-text-secondary)]
              hover:text-[var(--color-text)]
              hover:bg-[var(--color-bg-subtle)]
              transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--color-primary)]
            "
            aria-label="切换主题"
          >
            {settings.theme === 'light' ? (
              // 月亮图标（深色模式）
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              // 太阳图标（浅色模式）
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
