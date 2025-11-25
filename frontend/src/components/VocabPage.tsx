import { useState } from 'react';

export default function VocabPage() {
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">我的词库</h2>
          <p className="text-gray-500 text-sm">基于 SRS 间隔重复算法复习</p>
        </div>
        <div className="flex gap-4 text-center">
          <div className="bg-teal-50 px-4 py-2 rounded-lg border border-teal-100">
            <div className="text-xl font-bold text-teal-700">12</div>
            <div className="text-xs text-teal-600">今日待复习</div>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <div className="text-xl font-bold text-gray-700">843</div>
            <div className="text-xs text-gray-500">总词汇量</div>
          </div>
        </div>
      </div>

      <div className="bg-white w-full max-w-2xl mx-auto aspect-[4/3] md:aspect-[5/3] rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center justify-center relative p-8 text-center">
        <div className="absolute top-6 right-6">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Word</span>
        </div>

        <div className="mb-8">
          <h3 className="font-serif text-5xl text-gray-900 mb-4">Acquisition</h3>
          <div className="text-gray-400 italic text-lg">/ˌæk.wɪˈzɪʃ.ən/</div>
        </div>

        {showMeaning && (
          <div className="mb-10 max-w-lg text-gray-600 leading-relaxed">
            n. 获得，习得
            <br />
            <span className="text-sm text-gray-400">"Language acquisition is a subconscious process."</span>
          </div>
        )}

        {!showMeaning && (
          <button
            onClick={() => setShowMeaning(true)}
            className="mb-10 px-6 py-2 text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
          >
            显示释义
          </button>
        )}

        <div className="flex gap-4 w-full max-w-md">
          <button
            onClick={() => setShowMeaning(false)}
            className="flex-1 py-3 rounded-lg border-2 border-red-100 text-red-600 hover:bg-red-50 font-medium transition-colors"
          >
            忘记了
          </button>
          <button
            onClick={() => setShowMeaning(false)}
            className="flex-1 py-3 rounded-lg border-2 border-teal-100 text-teal-700 hover:bg-teal-50 font-medium transition-colors"
          >
            记得
          </button>
        </div>
      </div>
    </main>
  );
}
