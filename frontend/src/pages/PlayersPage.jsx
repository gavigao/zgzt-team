import { useState, useEffect } from 'react';
import { getPlayers } from '../api/public';
import PlayerCard from '../components/PlayerCard';
import EmptyState from '../components/EmptyState';
import { Crown } from 'lucide-react';

const STATUS_TABS = [
  { key: 'active', label: '现役队员' },
  { key: 'alumni', label: '历届队员' },
  { key: '', label: '全部' },
];

// 历届队长按时间顺序排列
const CAPTAIN_ORDER = [
  '张亦驰', '张劼', '霍禧齐', '依木拉', '杨晟',
  '蓝煜', '赵润石', '高嘉恒', '莫洋', '宋哈尔', '汤派',
];

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [captains, setCaptains] = useState([]);
  const limit = 12;

  // 获取历届队长
  useEffect(() => {
    getPlayers({ captain: 1, limit: 50 })
      .then(res => {
        // 按预定时间顺序排列
        const sorted = res.data.list.sort((a, b) => {
          const ai = CAPTAIN_ORDER.indexOf(a.name);
          const bi = CAPTAIN_ORDER.indexOf(b.name);
          if (ai === -1 && bi === -1) return 0;
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });
        setCaptains(sorted);
      })
      .catch(() => {});
  }, []);

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

      {/* 历届队长时间线 */}
      {captains.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
            <Crown size={20} className="text-amber-500" /> 历届队长
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {captains.map((c, i) => (
              <div
                key={c.id}
                className="flex-shrink-0 bg-white rounded-2xl card-shadow px-4 py-3 flex items-center gap-3 min-w-[140px]"
              >
                {/* 序号 */}
                <span className="text-xs font-bold text-text-sub w-5 text-center">
                  {i + 1}
                </span>
                {/* 照片（如有） */}
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {c.photo_url ? (
                    <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-gray-400 font-medium">
                      {c.name.charAt(0)}
                    </span>
                  )}
                </div>
                {/* 姓名 + 标签 */}
                <div>
                  <p className="text-sm font-semibold text-text-main whitespace-nowrap">
                    {c.name}
                  </p>
                  {c.is_captain === 1 ? (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                      现任
                    </span>
                  ) : (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      第{i + 1}任
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-6 flex-wrap">
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
