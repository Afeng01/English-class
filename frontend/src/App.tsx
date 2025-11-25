import { useState } from 'react';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import VocabPage from './components/VocabPage';
import ShelfPage from './components/ShelfPage';
import ReaderPage from './components/ReaderPage';

type Page = 'home' | 'shelf' | 'vocab' | 'reader';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-gray-800 flex flex-col">
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isLoggedIn={isLoggedIn}
        onToggleLogin={toggleLogin}
      />

      {currentPage === 'home' && (
        <HomePage
          isLoggedIn={isLoggedIn}
          onNavigate={setCurrentPage}
        />
      )}

      {currentPage === 'vocab' && <VocabPage />}

      {currentPage === 'shelf' && <ShelfPage />}

      {currentPage === 'reader' && (
        <ReaderPage onNavigate={setCurrentPage} />
      )}
    </div>
  );
}

export default App;
