import { useState, useEffect } from 'react';
import { getTrainingSchedules } from '../api/public';
import EmptyState from '../components/EmptyState';
import { CalendarDays, Clock, MapPin } from 'lucide-react';

const STATUS_CONFIG = {
  upcoming: { label: '即将进行', color: 'text-green-600 bg-green-50' },
  completed: { label: '已完成', color: 'text-text-sub bg-gray-100' },
  cancelled: { label: '已取消', color: 'text-red-500 bg-red-50 line-through' },
};

export default function TrainingPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = {};
    if (filter) params.status = filter;
    getTrainingSchedules(params)
      .then(res => setSchedules(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-2">训练与活动</h1>
      <p className="text-text-sub text-sm mb-6">球队训练安排与活动日程</p>

      {/* 筛选 */}
      <div className="flex gap-2 mb-8">
        {[
          { key: '', label: '全部' },
          { key: 'upcoming', label: '即将进行' },
          { key: 'completed', label: '已完成' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              filter === t.key ? 'bg-primary text-white' : 'bg-white text-text-sub hover:bg-gray-100 card-shadow'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 训练列表 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState icon="📅" title="暂无训练安排" description="训练活动将在后台添加后展示" />
      ) : (
        <div className="space-y-3">
          {schedules.map(s => {
            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.upcoming;
            return (
              <div key={s.id} className={`bg-white rounded-2xl card-shadow p-4 ${s.status === 'cancelled' ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-text-main">{s.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-text-sub">
                  <span className="flex items-center gap-1"><CalendarDays size={12} /> {s.schedule_date}</span>
                  {s.start_time && (
                    <span className="flex items-center gap-1"><Clock size={12} /> {s.start_time}{s.end_time ? ` - ${s.end_time}` : ''}</span>
                  )}
                  {s.location && (
                    <span className="flex items-center gap-1"><MapPin size={12} /> {s.location}</span>
                  )}
                </div>
                {s.description && (
                  <p className="text-xs text-text-sub mt-2 line-clamp-2">{s.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
