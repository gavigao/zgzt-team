import { useState, useEffect } from 'react';
import { getPlayers } from '../api/public';
import PlayerCard from '../components/PlayerCard';
import EmptyState from '../components/EmptyState';

const STATUS_TABS = [
  { key: 'active', label: '现役队员' },
  { key: 'alumni', label: '历届队员' },
  { key: '', label: '全部' },
];

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    const params = { page, limit };
    if (status) params.status = status;

    getPlayers(params)
      .then(res => {
        setPlayers(res.data.list);
        setTotal(res.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-2">队员名录</h1>
      <p className="text-text-sub text-sm mb-6">政国中统联队大家庭</p>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setStatus(t.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              status === t.key
                ? 'bg-primary text-white'
                : 'bg-white text-text-sub hover:bg-gray-100 card-shadow'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 队员卡片网格 */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <EmptyState icon="⚽" title="暂无队员" description="队员数据将在后台添加后展示" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {players.map(p => <PlayerCard key={p.id} player={p} />)}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-white card-shadow disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-text-sub px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-white card-shadow disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
