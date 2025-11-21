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
