import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export default function VocabularyPage() {
  const navigate = useNavigate();
  const { vocabulary, loadVocabulary, removeWord, updateWordStatus } = useAppStore();

  useEffect(() => {
    loadVocabulary();
  }, [loadVocabulary]);

  const learningWords = vocabulary.filter((v) => v.status === 'learning');
  const masteredWords = vocabulary.filter((v) => v.status === 'mastered');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-900">我的词库</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Learning words */}
        <section>
          <h2 className="text-xl font-bold mb-4">学习中 ({learningWords.length})</h2>
          {learningWords.length === 0 ? (
            <p className="text-gray-500 text-center py-12">暂无生词</p>
          ) : (
            <div className="space-y-3">
              {learningWords.map((vocab) => (
                <div
                  key={vocab.word}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="font-bold text-lg">{vocab.word}</span>
                        {vocab.phonetic && (
                          <span className="text-gray-500 text-sm">{vocab.phonetic}</span>
                        )}
                      </div>
                      {vocab.definition && (
                        <p className="text-gray-600 text-sm mb-2">{vocab.definition}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        添加于 {new Date(vocab.added_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => updateWordStatus(vocab.word, 'mastered')}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition"
                      >
                        已掌握
                      </button>
                      <button
                        onClick={() => removeWord(vocab.word)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mastered words */}
        <section>
          <h2 className="text-xl font-bold mb-4">已掌握 ({masteredWords.length})</h2>
          {masteredWords.length === 0 ? (
            <p className="text-gray-500 text-center py-12">暂无已掌握词汇</p>
          ) : (
            <div className="space-y-3">
              {masteredWords.map((vocab) => (
                <div
                  key={vocab.word}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="font-bold text-lg">{vocab.word}</span>
                        {vocab.phonetic && (
                          <span className="text-gray-500 text-sm">{vocab.phonetic}</span>
                        )}
                      </div>
                      {vocab.definition && (
                        <p className="text-gray-600 text-sm mb-2">{vocab.definition}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => updateWordStatus(vocab.word, 'learning')}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 transition"
                      >
                        继续学习
                      </button>
                      <button
                        onClick={() => removeWord(vocab.word)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
