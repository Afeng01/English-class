import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { Navigation, Footer } from '../components';
import * as Icons from '@phosphor-icons/react';

// 名言数据
const quotes = [
  {
    content: (
      <>
        "We acquire language in one way and only one way:{' '}
        <span className="text-emerald-700 font-semibold border-b-4 border-emerald-200">
          when we understand messages.
        </span>"
      </>
    ),
    author: 'Stephen Krashen',
  },
  {
    content: (
      <>
        "Language is not taught,{' '}
        <span className="text-emerald-700 font-semibold border-b-4 border-emerald-200">
          it is acquired.
        </span>"
      </>
    ),
    author: 'Stephen Krashen',
  },
];

type FilterMode = 'cn' | 'us' | 'lexile';

export default function HomePage() {
  const navigate = useNavigate();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [filterMode, setFilterMode] = useState<FilterMode>('cn');
  const { vocabulary } = useAppStore();

  // 名言轮播
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFCF7]">
      {/* 导航栏 */}
      <Navigation />

      <main className="flex-1">
        {/* 核心引导区 - Hero */}
        <section id="hero" className="bg-gradient-to-b from-[#F2ECE4] to-[#FBF9F5] border-b border-[#EAE0D7]">
          <div className="max-w-screen-xl mx-auto px-6 py-16 grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* 左侧内容 */}
            <div className="space-y-10">
              {/* 标签 */}
              <p className="uppercase text-xs tracking-[0.35em] text-emerald-700">
                COMPREHENSIBLE INPUT
              </p>

              {/* 名言轮播 */}
              <div className="relative min-h-[180px]">
                {quotes.map((quote, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 flex flex-col justify-center transition-all duration-700 ${
                      quoteIndex === index
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-3 pointer-events-none'
                    }`}
                  >
                    <h1 className="font-serif text-4xl lg:text-5xl font-light leading-tight text-gray-900">
                      {quote.content}
                    </h1>
                    <p className="mt-4 text-lg text-gray-500">— {quote.author}</p>
                  </div>
                ))}
              </div>

              {/* 简介文字 */}
              <p className="text-base text-gray-600 leading-relaxed">
                ReadAcquire 倡导"可理解输入"，用持续阅读、语块感知和沉浸式理解帮助学习者自然习得英语。
                每一次翻页都记录成长，数据面板同步反馈进度与词汇增量。
              </p>

              {/* 三个按钮 */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/books')}
                  className="px-8 py-3 rounded-full bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-700/30 hover:bg-emerald-800 transition flex items-center gap-2"
                >
                  <Icons.ReadCvLogo weight="fill" />
                  开始阅读
                </button>
                <button className="px-8 py-3 rounded-full bg-white border border-gray-200 text-gray-800 shadow-sm hover:border-emerald-500 hover:text-emerald-700 transition flex items-center gap-2">
                  <Icons.Lightbulb weight="bold" />
                  学习原理
                </button>
                <button
                  onClick={() => navigate('/vocabulary')}
                  className="px-8 py-3 rounded-full text-emerald-700 border border-transparent hover:border-emerald-100 bg-emerald-50 flex items-center gap-2 transition"
                >
                  <Icons.CheckCircle weight="bold" />
                  词汇评测
                </button>
              </div>

              {/* 四个数据卡片 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded-3xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-emerald-700">328</p>
                  <p className="text-xs text-gray-500">累计阅读天数</p>
                </div>
                <div className="bg-white rounded-3xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-emerald-700">{vocabulary.length.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">吸收词汇</p>
                </div>
                <div className="bg-white rounded-3xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-emerald-700">18</p>
                  <p className="text-xs text-gray-500">完成书籍</p>
                </div>
                <div className="bg-white rounded-3xl p-4 shadow-sm">
                  <p className="text-2xl font-bold text-emerald-700">97%</p>
                  <p className="text-xs text-gray-500">理解度</p>
                </div>
              </div>
            </div>

            {/* 右侧玻璃拟态卡片 */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/70 rounded-[32px] p-8 shadow-[0_25px_50px_-12px_rgba(15,118,110,0.2)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">本周阅读</p>
                  <p className="text-3xl font-semibold text-gray-900">4 小时 28 分</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">+18%</span>
              </div>
              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>词汇吸收</span>
                    <span>2,140/3,000</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '71%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>语块熟悉度</span>
                    <span>82%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: '82%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>沉浸时长</span>
                    <span>18/21 天</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: '86%' }} />
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-2xl bg-[#F7FBFA] border border-[#E8F3F1] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-700">
                    <Icons.Globe weight="fill" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">目标蓝思值</p>
                    <p className="text-lg font-semibold text-gray-900">600L - 750L</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  根据近 30 天表现生成的推荐范围，帮助在可理解输入和挑战之间保持平衡。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 继续阅读 */}
        <section id="progress" className="max-w-screen-xl mx-auto px-6 py-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="uppercase text-xs tracking-[0.35em] text-emerald-700">KEEP GOING</p>
              <h2 className="text-3xl font-bold mt-2">继续阅读</h2>
              <p className="text-gray-500 text-sm mt-1">追踪多本书籍的实时进度，补全沉浸式输入闭环。</p>
            </div>
            <a href="#" className="text-sm text-emerald-700 flex items-center gap-1 hover:underline">
              查看全部 <Icons.ArrowUpRight weight="bold" />
            </a>
          </div>

          <div className="grid gap-6 mt-10 md:grid-cols-3">
            {/* 卡片1 */}
            <article className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition">
              <div className="flex items-start gap-4">
                <div className="w-20 h-28 rounded-2xl bg-gradient-to-br from-emerald-100 to-white flex items-center justify-center text-emerald-600 relative overflow-hidden">
                  <Icons.Book weight="fill" className="text-3xl" />
                  <span className="absolute top-0 left-0 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-br">L2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">The Little Prince</h3>
                  <p className="text-xs text-gray-500 mt-1">Antoine de Saint-Exupéry</p>
                  <p className="text-xs text-gray-400 mt-2">章节 14 / 27</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>进度</span>
                  <span>45%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '45%' }} />
                </div>
              </div>
            </article>

            {/* 卡片2 */}
            <article className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition">
              <div className="flex items-start gap-4">
                <div className="w-20 h-28 rounded-2xl bg-gradient-to-br from-amber-100 to-white flex items-center justify-center text-amber-500 relative overflow-hidden">
                  <Icons.Book weight="fill" className="text-3xl" />
                  <span className="absolute top-0 left-0 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-br">L3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">Flipped</h3>
                  <p className="text-xs text-gray-500 mt-1">Wendelin Van Draanen</p>
                  <p className="text-xs text-gray-400 mt-2">章节 4 / 34</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>进度</span>
                  <span>12%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '12%' }} />
                </div>
              </div>
            </article>

            {/* 添加新书卡片 */}
            <article className="border border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-700 hover:border-emerald-400 transition cursor-pointer">
              <Icons.PlusCircle weight="bold" className="text-4xl mb-3" />
              <p className="text-sm">从书架添加新书</p>
              <p className="text-xs text-gray-400 mt-1">同步书架即可创建沉浸计划</p>
            </article>
          </div>
        </section>

        {/* 习得路径 */}
        <section id="path" className="bg-white border-y border-[#F0E8DE]">
          <div className="max-w-screen-xl mx-auto px-6 py-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="uppercase text-xs tracking-[0.35em] text-emerald-700">LEARNING FLOW</p>
                <h2 className="text-3xl font-bold mt-2">习得路径</h2>
                <p className="text-gray-500 text-sm mt-2">以输入为中心串联评测、阅读和复盘，形成正向闭环。</p>
              </div>
              <button className="px-6 py-3 rounded-full bg-emerald-700 text-white text-sm shadow hover:bg-emerald-800 transition">
                下载学习计划
              </button>
            </div>

            <div className="grid gap-6 mt-10 md:grid-cols-3">
              <article className="bg-white/90 backdrop-blur-sm border border-white/70 rounded-3xl p-6 shadow-[0_25px_50px_-12px_rgba(15,118,110,0.2)]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center mb-4">
                  <Icons.Broadcast weight="bold" />
                </div>
                <h3 className="text-xl font-semibold">评测初始化</h3>
                <p className="text-sm text-gray-500 mt-2">通过词汇和语块测验确定起始蓝思段位，生成初版阅读书单。</p>
              </article>
              <article className="bg-white/90 backdrop-blur-sm border border-white/70 rounded-3xl p-6 shadow-[0_25px_50px_-12px_rgba(15,118,110,0.2)]">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mb-4">
                  <Icons.ReadCvLogo weight="bold" />
                </div>
                <h3 className="text-xl font-semibold">沉浸式阅读</h3>
                <p className="text-sm text-gray-500 mt-2">在统一界面完成阅读、标注与语块收藏，进度与统计实时回写仪表盘。</p>
              </article>
              <article className="bg-white/90 backdrop-blur-sm border border-white/70 rounded-3xl p-6 shadow-[0_25px_50px_-12px_rgba(15,118,110,0.2)]">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-600 flex items-center justify-center mb-4">
                  <Icons.Rewind weight="bold" />
                </div>
                <h3 className="text-xl font-semibold">复盘与跃迁</h3>
                <p className="text-sm text-gray-500 mt-2">结合阅读日志和语块数据输出建议，提示上调蓝思段位或切换主题域。</p>
              </article>
            </div>
          </div>
        </section>

        {/* 书架资源 */}
        <section id="library" className="max-w-screen-xl mx-auto px-6 py-16">
          <div className="flex flex-col gap-4">
            <div>
              <p className="uppercase text-xs tracking-[0.35em] text-emerald-700">LIBRARY</p>
              <h2 className="text-3xl font-bold mt-2">书架资源库</h2>
              <p className="text-sm text-gray-500 mt-2">以不同体系筛选目标材料，平衡兴趣与难度。</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm px-4 py-2 flex flex-wrap gap-2 text-sm font-medium">
              <button
                onClick={() => setFilterMode('cn')}
                className={`px-6 py-2 rounded-full transition ${
                  filterMode === 'cn' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-500'
                }`}
              >
                中国年级
              </button>
              <button
                onClick={() => setFilterMode('us')}
                className={`px-6 py-2 rounded-full transition ${
                  filterMode === 'us' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-500'
                }`}
              >
                美国年级
              </button>
              <button
                onClick={() => setFilterMode('lexile')}
                className={`px-6 py-2 rounded-full transition ${
                  filterMode === 'lexile' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-500'
                }`}
              >
                蓝思值
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
              {filterMode === 'cn' && (
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm">全部</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">小学 1-3 年级</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">小学 4-6 年级</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">初中 1 年级</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">初中 2-3 年级</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">高中 / 大学</button>
                </div>
              )}

              {filterMode === 'us' && (
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm">All</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">Pre-K</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">Grade 1-3</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">Grade 4-6</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">Middle School</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">High School</button>
                </div>
              )}

              {filterMode === 'lexile' && (
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm">All</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">0L - 200L</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">200L - 500L</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">500L - 800L</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">800L - 1000L</button>
                  <button className="px-5 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-sm hover:border-emerald-500">1000L+</button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <Footer />
    </div>
  );
}
