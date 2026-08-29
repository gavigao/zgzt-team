import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../api/admin';
import { Users, Swords, Newspaper, Image, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboard().then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="skeleton h-32 rounded-2xl" />;

  const cards = [
    { label: '队员', value: stats.playerCount, icon: Users, color: 'text-blue-600 bg-blue-50', to: '/admin/players' },
    { label: '比赛', value: stats.matchCount, icon: Swords, color: 'text-primary bg-red-50', to: '/admin/matches' },
    { label: '新闻', value: stats.newsCount, icon: Newspaper, color: 'text-green-600 bg-green-50', to: '/admin/news' },
    { label: '用户', value: stats.userCount, icon: Users, color: 'text-purple-600 bg-purple-50', to: '/admin/users' },
    { label: '帖子', value: stats.postCount ?? stats.boardPostCount ?? '—', icon: MessageSquare, color: 'text-amber-600 bg-amber-50' },
    { label: '相册', value: stats.albumCount, icon: Image, color: 'text-teal-600 bg-teal-50', to: '/admin/photos' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-text-main mb-1">管理仪表盘</h1>
      <p className="text-sm text-text-sub mb-6">网站数据概览</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => {
          const content = (
            <>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${c.color}`}>
              <c.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-text-main tabular-nums">{c.value}</p>
            <p className="text-xs text-text-sub mt-0.5">{c.label}</p>
            </>
          );

          return c.to ? (
            <Link
              key={c.label}
              to={c.to}
              className="bg-white rounded-2xl card-shadow p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={`进入${c.label}管理`}
            >
              {content}
            </Link>
          ) : (
            <div key={c.label} className="bg-white rounded-2xl card-shadow p-4 text-center">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
