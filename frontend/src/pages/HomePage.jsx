import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Swords } from 'lucide-react';
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
  const [training, setTraining] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(value => (value + 1) % SLIDES.length);
    }, 4000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const goTo = index => {
    setCurrent(index);
    startTimer();
  };

  useEffect(() => {
    Promise.all([
      getTrainingSchedules({ upcoming: 1, limit: 3 }),
      getMatches({ scope: 'upcoming', limit: 3 }),
      getMatches({ scope: 'completed', limit: 3 }),
      getNews({ limit: 3 }),
    ])
      .then(([trainingRes, upcomingRes, recentRes, newsRes]) => {
        setTraining(trainingRes.data);
        setUpcomingMatches(upcomingRes.data.list);
        setRecentMatches(recentRes.data.list);
        setLatestNews(newsRes.data.list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="relative w-full h-[70vh] min-h-[400px] max-h-[600px] bg-gray-900 overflow-hidden">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ${index === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={slide.src} alt={slide.alt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
          </div>
        ))}

        <button
          onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 text-white flex items-center justify-center z-10"
          aria-label="上一张照片"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => goTo((current + 1) % SLIDES.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 text-white flex items-center justify-center z-10"
          aria-label="下一张照片"
        >
          <ChevronRight size={22} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 pb-8 z-10">
          <div className="max-w-6xl mx-auto px-4 text-center text-white">
            <h1 className="text-3xl lg:text-5xl font-bold mb-2 drop-shadow-lg">政国中统联队</h1>
            <p className="text-sm lg:text-base text-gray-200 mb-1 drop-shadow">对外经济贸易大学</p>
            <p className="text-xs text-gray-300 drop-shadow">政府管理学院 · 国际关系学院 · 中文学院 · 统计学院</p>
            <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
              <Link to="/matches" className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 shadow-lg flex items-center gap-1.5">
                <Swords size={16} /> 赛程与比赛
              </Link>
              <Link to="/board" className="px-5 py-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium rounded-xl hover:bg-white/25 border border-white/20 flex items-center gap-1">
                去留言板 <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.src}
              onClick={() => goTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${index === current ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/70'}`}
              aria-label={`查看第 ${index + 1} 张照片`}
            />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <CalendarDays size={20} className="text-secondary" /> 训练与活动安排
          </h2>
          <Link to="/training" className="text-sm text-secondary hover:underline flex items-center gap-1">
            全部安排 <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
        ) : training.length === 0 ? (
          <div className="bg-white rounded-2xl card-shadow p-8 text-center text-sm text-text-sub">暂时没有新的训练或活动安排</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">{training.map(item => <TrainingCard key={item.id} schedule={item} />)}</div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <Swords size={20} className="text-primary" /> 赛程与比赛
          </h2>
          <Link to="/matches" className="text-sm text-secondary hover:underline flex items-center gap-1">
            全部比赛 <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-text-main mb-3">📅 接下来踢谁</h3>
              {upcomingMatches.length === 0 ? (
                <div className="bg-white rounded-2xl card-shadow p-7 text-center text-sm text-text-sub">未来赛程还没有录入</div>
              ) : (
                <div className="space-y-3">{upcomingMatches.map(match => <MatchCard key={match.id} match={match} />)}</div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-main mb-3">🏁 最近战绩</h3>
              {recentMatches.length === 0 ? (
                <div className="bg-white rounded-2xl card-shadow p-7 text-center text-sm text-text-sub">暂无已结束的比赛</div>
              ) : (
                <div className="space-y-3">{recentMatches.map(match => <MatchCard key={match.id} match={match} />)}</div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-main">📰 球队新闻</h2>
          <Link to="/news" className="text-sm text-secondary hover:underline flex items-center gap-1">
            更多新闻 <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-56 rounded-2xl" />)}</div>
        ) : latestNews.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">暂无新闻</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">{latestNews.map(news => <NewsCard key={news.id} news={news} />)}</div>
        )}
      </section>
    </div>
  );
}
