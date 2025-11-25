import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Github, Heart } from 'lucide-react';

export default function AboutPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">关于我们</h1>
        <p className="text-lg text-gray-600">
          EnglishAcquire - 通过阅读习得英语
        </p>
      </div>

      {/* 项目介绍 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Heart className="w-6 h-6 text-teal-600" />
          项目理念
        </h2>
        <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
          <p>
            "Language is not taught, it is acquired." —— Stephen Krashen
          </p>
          <p>
            EnglishAcquire 基于语言习得理论，旨在通过大量的可理解输入（Comprehensible Input）
            帮助学习者自然地习得英语。我们相信，语言学习不应该是枯燥的背诵和练习，
            而应该是一个充满乐趣和意义的探索过程。
          </p>
          <p>
            通过阅读适合自己水平的英文原版书籍，学习者可以在真实的语境中接触语言，
            积累词汇，培养语感，最终达到流利使用英语的目标。
          </p>
        </div>
      </div>

      {/* 功能特点 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">核心功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">分级阅读</h3>
              <p className="text-sm text-gray-600">
                根据中国年级、美国年级和蓝思值对书籍进行分级，帮助读者找到适合自己水平的书籍
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📖</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">在线阅读</h3>
              <p className="text-sm text-gray-600">
                支持 EPUB 格式电子书，提供舒适的阅读体验，记录阅读进度
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🔤</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">词汇学习</h3>
              <p className="text-sm text-gray-600">
                点击生词即可查看释义，自动收录到个人词库，统计高频词汇
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">学习追踪</h3>
              <p className="text-sm text-gray-600">
                记录阅读进度、生词数量等学习数据，帮助你了解学习效果
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 联系方式 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">联系我们</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-5 h-5 text-teal-600" />
            <span>邮箱：</span>
            <a href="mailto:contact@example.com" className="text-teal-700 hover:underline">
              contact@example.com
            </a>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Github className="w-5 h-5 text-teal-600" />
            <span>GitHub：</span>
            <a
              href="https://github.com/your-repo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 hover:underline"
            >
              github.com/your-repo
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>感谢使用 EnglishAcquire，祝你英语学习之旅愉快！</p>
        </div>
      </div>
    </main>
  );
}
