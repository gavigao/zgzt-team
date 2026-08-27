import { useState, useEffect } from 'react';
import { getMatches, getSeasons } from '../api/public';
import MatchCard from '../components/MatchCard';
import EmptyState from '../components/EmptyState';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [total, setTotal] = useState(0);
  const [seasons, setSeasons] = useState([]);
  const [season, setSeason] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    getSeasons().then(res => setSeasons(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit };
    if (season) params.season = season;
    getMatches(params)
      .then(res => { setMatches(res.data.list); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [season, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-2">赛程与比赛</h1>
      <p className="text-text-sub text-sm mb-6">未来赛程会排在前面，已结束比赛继续保留完整战绩</p>

      {/* 赛季筛选 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => { setSeason(''); setPage(1); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            !season ? 'bg-primary text-white' : 'bg-white text-text-sub hover:bg-gray-100 card-shadow'
          }`}
        >
          全部赛季
        </button>
        {seasons.map(s => (
          <button
            key={s.id}
            onClick={() => { setSeason(s.id); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              season === s.id ? 'bg-primary text-white' : 'bg-white text-text-sub hover:bg-gray-100 card-shadow'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* 比赛列表 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState icon="⚽" title="暂无比赛记录" description="比赛数据将在后台添加后展示" />
      ) : (
        <>
          <div className="space-y-3">
            {matches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-white card-shadow disabled:opacity-40 hover:bg-gray-50">
                上一页
              </button>
              <span className="text-sm text-text-sub">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-white card-shadow disabled:opacity-40 hover:bg-gray-50">
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
