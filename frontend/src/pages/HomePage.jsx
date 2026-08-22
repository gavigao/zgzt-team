import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Swords, ChevronLeft } from 'lucide-react';
import { getMatches, getNews, getTeamInfo, getBanners } from '../api/public';
import MatchCard from '../components/MatchCard';
import NewsCard from '../components/NewsCard';

// 轮播图片
const SLIDES = [
  { src: '/images/捧杯时刻.jpg', alt: '捧杯时刻' },
  { src: '/images/26年6月颁奖典礼合照.jpg', alt: '颁奖典礼合照' },
  { src: '/images/毕业礼物.jpg', alt: '毕业礼物' },
  { src: '/images/决赛庆祝2.jpg', alt: '决赛庆祝' },
  { src: '/images/决赛后聚餐.jpg', alt: '决赛后聚餐' },
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const [latestMatches, setLatestMatches] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [banners, setBanners] = useState([]);
  const [intro, setIntro] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  // 轮播图：优先用后台「首页轮播」相册，否则用内置默认图
  const slides = banners.length > 0
    ? banners.map(b => ({ src: b.url, alt: b.caption || '首页轮播' }))
    : SLIDES;

  // 自动轮播
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 4000);
  }, [slides.length]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const goTo = (i) => {
    setCurrent(i);
    startTimer(); // 手动切换后重置计时
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  // 加载比赛、新闻、轮播图和球队介绍
  useEffect(() => {
    Promise.all([
      getMatches({ limit: 3 }),
      getNews({ limit: 3 }),
    ]).then(([mRes, nRes]) => {
      setLatestMatches(mRes.data.list);
      setLatestNews(nRes.data.list);
    }).catch(() => {}).finally(() => setLoading(false));

    getBanners().then(res => setBanners(res.data || [])).catch(() => {});
    getTeamInfo('introduction').then(res => { if (res.data) setIntro(res.data); }).catch(() => {});
  }, []);

  return (
    <div>
      {/* 全屏轮播 Hero */}
      <section className="relative w-full h-[70vh] min-h-[400px] max-h-[600px] bg-gray-900 overflow-hidden">
        {/* 图片 */}
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-cover"
            />
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
          </div>
        ))}

        {/* 左右箭头 */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
        >
          <ChevronRight size={22} />
        </button>

        {/* 底部：队名 + 按钮 */}
        <div className="absolute bottom-0 left-0 right-0 pb-8 z-10">
          <div className="max-w-6xl mx-auto px-4 text-center text-white">
            <h1 className="text-3xl lg:text-5xl font-bold mb-2 drop-shadow-lg">
              政国中统联队
            </h1>
            <p className="text-sm lg:text-base text-gray-200 mb-1 drop-shadow">对外经济贸易大学</p>
            <p className="text-xs text-gray-300 drop-shadow">
              政府管理学院 · 国际关系学院 · 中文学院 · 统计学院
            </p>
            <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
              <Link to="/matches" className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg flex items-center gap-1.5">
                <Swords size={16} /> 比赛记录
              </Link>
              <Link to="/players" className="px-5 py-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium rounded-xl hover:bg-white/25 transition-colors border border-white/20 flex items-center gap-1">
                队员名录 <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* 导航圆点 */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 关于我们 / 球队介绍 */}
      {intro?.content && (
        <section className="max-w-6xl mx-auto px-4 pt-12">
          <h2 className="text-xl font-bold text-text-main mb-4">关于我们</h2>
          <div className="bg-white rounded-2xl card-shadow p-6 text-text-main leading-relaxed whitespace-pre-wrap text-sm">
            {intro.content}
          </div>
        </section>
      )}

      {/* 最新比赛 */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <Swords size={20} className="text-primary" /> 最新比赛
          </h2>
          <Link to="/matches" className="text-sm text-secondary hover:underline flex items-center gap-1">
            全部比赛 <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        ) : latestMatches.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">暂无比赛记录</p>
        ) : (
          <div className="space-y-3">
            {latestMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>

      {/* 最新新闻 */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main">📰 球队新闻</h2>
          <Link to="/news" className="text-sm text-secondary hover:underline flex items-center gap-1">
            更多新闻 <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-56 rounded-2xl" />)}
          </div>
        ) : latestNews.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">暂无新闻</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {latestNews.map(n => <NewsCard key={n.id} news={n} />)}
          </div>
        )}
      </section>
    </div>
  );
}
