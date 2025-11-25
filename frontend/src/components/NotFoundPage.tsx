import { useNavigate } from 'react-router-dom';
import { BookOpen, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex-grow flex flex-col items-center justify-center bg-[#F9F7F2] px-4">
      <BookOpen className="w-20 h-20 text-gray-300 mb-6" />
      <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
      <p className="text-xl text-gray-600 mb-8">页面未找到</p>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors"
      >
        <Home className="w-5 h-5" />
        返回首页
      </button>
    </main>
  );
}
