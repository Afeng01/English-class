import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import VocabPage from './components/VocabPage';
import ShelfPage from './components/ShelfPage';
import BookDetailPage from './components/BookDetailPage';
import ReaderPage from './components/ReaderPage';
import UploadPage from './components/UploadPage';
import AboutPage from './components/AboutPage';
import NotFoundPage from './components/NotFoundPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  });

  useEffect(() => {
    // 应用主题到 document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-[#F9F7F2] text-gray-800'} flex flex-col transition-colors duration-300`}>
      <Navigation
        isLoggedIn={isLoggedIn}
        onToggleLogin={toggleLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <Routes>
        <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
        <Route path="/shelf" element={<ShelfPage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="/vocab" element={<VocabPage />} />
        <Route path="/reader" element={<ReaderPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
