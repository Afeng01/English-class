import { BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LearningTheoryPage() {
  const navigate = useNavigate();

  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-10">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-teal-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回</span>
      </button>

      {/* 标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">学习原理</h1>
        <p className="text-lg text-gray-600">
          基于语言习得理论的学习方法
        </p>
      </div>

      {/* 主要内容 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">该内容正在开发中</h2>
          <p className="text-lg text-gray-500 text-center max-w-md">
            我们正在整理相关学习理论和方法论
          </p>
          <div className="mt-8 text-sm text-gray-400">
            敬请期待...
          </div>
        </div>
      </div>
    </main>
  );
}
