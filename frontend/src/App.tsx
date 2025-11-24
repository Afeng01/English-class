import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import BooksPage from './pages/BooksPage';
import BookDetailPage from './pages/BookDetailPage';
import ReaderPage from './pages/ReaderPage';
import VocabularyPage from './pages/VocabularyPage';
import { useAppStore } from './stores/useAppStore';

function App() {
  const { loadVocabulary, loadSettings } = useAppStore();

  useEffect(() => {
    // 初始化加载本地数据
    loadVocabulary();
    loadSettings();
  }, [loadVocabulary, loadSettings]);

  useEffect(() => {
    // 滚动触发动画 - Intersection Observer
    const observerOptions = {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // 一次性动画，观察后即移除
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // 观察所有带有 .reveal 类的元素
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/reader/:id" element={<ReaderPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
