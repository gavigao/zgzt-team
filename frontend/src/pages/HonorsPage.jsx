import { useState, useEffect } from 'react';
import { getHonors } from '../api/public';
import EmptyState from '../components/EmptyState';
import { Trophy, User } from 'lucide-react';

export default function HonorsPage() {
  const [honors, setHonors] = useState([]);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    const params = { page, limit };
    if (type) params.type = type;
    getHonors(params)
      .then(res => { setHonors(res.data.list); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, page]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-2">荣誉墙</h1>
      <p className="text-text-sub text-sm mb-6">团队与个人荣誉</p>

      {/* 类型筛选 */}
      <div className="flex gap-2 mb-8">
        {[
          { key: '', label: '全部' },
          { key: 'team', label: '🏆 团队荣誉' },
          { key: 'individual', label: '👤 个人荣誉' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setType(t.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              type === t.key ? 'bg-primary text-white' : 'bg-white text-text-sub hover:bg-gray-100 card-shadow'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 荣誉列表 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : honors.length === 0 ? (
        <EmptyState icon="🏆" title="暂无荣誉记录" description="荣誉数据将在后台添加后展示" />
      ) : (
        <div className="space-y-3">
          {honors.map(h => (
            <div key={h.id} className="bg-white rounded-2xl card-shadow p-4 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
                h.type === 'team' ? 'bg-amber-100' : 'bg-blue-100'
              }`}>
                {h.type === 'team' ? <Trophy size={20} className="text-amber-600" /> : <User size={20} className="text-blue-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-main">{h.title}</h3>
                {h.recipient && <p className="text-xs text-text-sub mt-0.5">获得者：{h.recipient}</p>}
                {h.description && <p className="text-xs text-text-sub mt-1 line-clamp-2">{h.description}</p>}
              </div>
              {h.honor_date && (
                <span className="text-xs text-text-sub flex-shrink-0 mt-1">{h.honor_date}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-white card-shadow disabled:opacity-40">上一页</button>
          <span className="text-sm text-text-sub">{page} / {Math.ceil(total / limit)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}
            className="px-3 py-1.5 text-sm rounded-lg bg-white card-shadow disabled:opacity-40">下一页</button>
        </div>
      )}
    </div>
  );
}
