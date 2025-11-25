import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import VocabPage from './components/VocabPage';
import ShelfPage from './components/ShelfPage';
import ReaderPage from './components/ReaderPage';
import NotFoundPage from './components/NotFoundPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-gray-800 flex flex-col">
      <Navigation
        isLoggedIn={isLoggedIn}
        onToggleLogin={toggleLogin}
      />

      <Routes>
        <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
        <Route path="/shelf" element={<ShelfPage />} />
        <Route path="/vocab" element={<VocabPage />} />
        <Route path="/reader" element={<ReaderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
