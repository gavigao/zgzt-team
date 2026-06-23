import { useState, useEffect } from 'react';
import { getTeamInfo } from '../api/public';

export default function HistoryPage() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamInfo('history')
      .then(res => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 里程碑数据（硬编码展示，配合后端 team_info 中 history key 的富文本内容）
  const milestones = [
    { year: '2019', title: '联队成立', desc: '政府管理学院、国际关系学院、中文学院、统计学院四院联合组建"政国中统联队"，首次参加校联赛' },
    { year: '2023', title: '新队长上任', desc: '23 级经济统计学专业队员接任队长' },
    { year: '2026', title: '建队 8 周年', desc: '联队走过八年历程，建立球队网站记录历史' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-2">球队历史</h1>
      <p className="text-text-sub text-sm mb-8">政国中统联队的发展历程</p>

      {/* 从后端获取的历史介绍 */}
      {loading ? (
        <div className="skeleton h-32 rounded-2xl mb-8" />
      ) : history?.content ? (
        <div className="bg-white rounded-2xl card-shadow p-6 mb-8 prose prose-sm max-w-none text-text-main whitespace-pre-wrap leading-relaxed">
          {history.content}
        </div>
      ) : (
        <div className="bg-white rounded-2xl card-shadow p-6 mb-8 text-center text-text-sub text-sm">
          球队历史介绍将在后台编辑后展示
        </div>
      )}

      {/* 时间线 */}
      <h2 className="text-lg font-semibold text-text-main mb-6">大事记</h2>
      <div className="relative">
        {/* 竖线 */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-8">
          {milestones.map((m, i) => (
            <div key={i} className="relative flex gap-5 pl-12">
              {/* 圆点 */}
              <div className={`absolute left-[12px] top-1.5 w-4 h-4 rounded-full border-2 border-white ${
                i === 0 ? 'bg-primary' : 'bg-secondary'
              }`} />
              <div className="bg-white rounded-xl card-shadow p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {m.year}
                  </span>
                  <h3 className="font-semibold text-sm text-text-main">{m.title}</h3>
                </div>
                <p className="text-xs text-text-sub leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
