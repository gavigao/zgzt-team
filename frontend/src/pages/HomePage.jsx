import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Pause,
  Play,
  Swords,
} from 'lucide-react';
import { getMatches, getNews, getTrainingSchedules } from '../api/public';
import MatchCard from '../components/MatchCard';
import NewsCard from '../components/NewsCard';
import TrainingCard from '../components/TrainingCard';

const SLIDES = [
  { src: '/images/捧杯时刻.jpg', alt: '捧杯时刻' },
  { src: '/images/26年6月颁奖典礼合照.jpg', alt: '颁奖典礼合照' },
  { src: '/images/毕业礼物.jpg', alt: '毕业礼物' },
  { src: '/images/决赛庆祝2.jpg', alt: '决赛庆祝' },
  { src: '/images/决赛后聚餐.jpg', alt: '决赛后聚餐' },
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [training, setTraining] = useState([]);
  const [matches, setMatches] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncMotionPreference();
    mediaQuery.addEventListener('change', syncMotionPreference);
    return () => mediaQuery.removeEventListener('change', syncMotionPreference);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return undefined;

    timerRef.current = setInterval(() => {
      setCurrent(value => (value + 1) % SLIDES.length);
    }, 6000);

    return () => clearInterval(timerRef.current);
  }, [isPaused, prefersReducedMotion]);

  const goTo = index => setCurrent(index);

  useEffect(() => {
    Promise.all([
      getTrainingSchedules({ upcoming: 1, limit: 3 }),
      getMatches({ limit: 6 }),
      getNews({ limit: 3 }),
    ])
      .then(([trainingRes, matchesRes, newsRes]) => {
        setTraining(trainingRes.data);
        setMatches(matchesRes.data.list);
        setLatestNews(newsRes.data.list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-x-clip">
      <section
        className="relative isolate w-full h-[58svh] min-h-[420px] max-h-[560px] sm:h-[64vh] sm:min-h-[480px] sm:max-h-[640px] lg:h-[70vh] lg:max-h-[680px] bg-slate-950 overflow-hidden"
        aria-roledescription="carousel"
        aria-label="球队精彩瞬间"
      >
        {SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            aria-hidden={index !== current}
            className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${index === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={slide.src}
              alt={index === current ? slide.alt : ''}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              decoding="async"
              className={`w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-[6000ms] ${index === current ? 'motion-safe:scale-105' : 'scale-100'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/10 to-slate-950/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 via-transparent to-transparent" />
          </div>
        ))}

        <button
          type="button"
          onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center z-10 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          aria-label="上一张照片"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={() => goTo((current + 1) % SLIDES.length)}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center z-10 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          aria-label="下一张照片"
        >
          <ChevronRight size={22} />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-10 pb-16 sm:pb-20">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center text-white">
            <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] backdrop-blur-sm">校园足球</p>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight [text-wrap:balance] drop-shadow-lg">政国中统联队</h1>
            <p className="mt-3 text-sm sm:text-base text-slate-100 drop-shadow">对外经济贸易大学</p>
            <p className="mx-auto mt-1 max-w-2xl text-xs sm:text-sm leading-6 text-slate-200 drop-shadow">政府管理学院 · 国际关系学院 · 中文学院 · 统计学院</p>
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <Link to="/matches" className="min-h-11 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-950/30 inline-flex items-center gap-1.5 transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                <Swords size={16} /> 赛程安排
              </Link>
              <Link to="/board" className="min-h-11 px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white text-sm font-semibold rounded-xl border border-white/20 inline-flex items-center gap-1 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                去留言板 <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center z-10" aria-label="轮播控制">
          {SLIDES.map((slide, index) => (
            <button
              type="button"
              key={slide.src}
              onClick={() => goTo(index)}
              className="group w-11 h-11 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
              aria-label={`查看第 ${index + 1} 张照片`}
              aria-current={index === current ? 'true' : undefined}
            >
              <span className={`h-2 rounded-full transition-all motion-reduce:transition-none ${index === current ? 'bg-white w-5' : 'bg-white/45 w-2 group-hover:bg-white/70'}`} />
            </button>
          ))}
          {!prefersReducedMotion && (
            <button
              type="button"
              onClick={() => setIsPaused(value => !value)}
              className="ml-1 w-11 h-11 inline-flex items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={isPaused ? '播放轮播' : '暂停轮播'}
            >
              {isPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}
            </button>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-secondary">近期安排</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-text-main flex items-center gap-2">
              <CalendarDays size={21} className="text-secondary" aria-hidden="true" /> 训练与活动安排
            </h2>
          </div>
          <Link to="/training" className="-mr-2 min-h-11 px-2 text-sm font-medium text-secondary hover:text-blue-800 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg">
            全部 <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
        ) : training.length === 0 ? (
          <div className="bg-white rounded-2xl card-shadow p-8 text-center text-sm text-text-sub">暂时没有新的训练或活动安排</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">{training.map(item => <TrainingCard key={item.id} schedule={item} />)}</div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-primary">赛程</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-text-main flex items-center gap-2">
              <Swords size={21} className="text-primary" aria-hidden="true" /> 赛程安排
            </h2>
          </div>
          <Link to="/matches" className="-mr-2 min-h-11 px-2 text-sm font-medium text-secondary hover:text-blue-800 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg">
            全部 <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-2xl card-shadow p-8 text-center text-sm text-text-sub">暂时没有赛程记录</div>
        ) : (
          <div className="space-y-3">{matches.map(match => <MatchCard key={match.id} match={match} />)}</div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-secondary">最新动态</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-text-main flex items-center gap-2"><Newspaper size={21} className="text-secondary" aria-hidden="true" /> 球队新闻</h2>
          </div>
          <Link to="/news" className="-mr-2 min-h-11 px-2 text-sm font-medium text-secondary hover:text-blue-800 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg">
            全部 <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-60 rounded-2xl" />)}</div>
        ) : latestNews.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">暂无新闻</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">{latestNews.map(news => <NewsCard key={news.id} news={news} />)}</div>
        )}
      </section>
    </div>
  );
}
