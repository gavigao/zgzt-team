import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerById } from '../api/public';
import { User, ArrowLeft } from 'lucide-react';

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlayerById(id)
      .then(res => setPlayer(res.data))
      .catch(() => setError('队员不存在或已被删除'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-text-sub mb-4">{error || '队员不存在'}</p>
        <Link to="/players" className="text-primary text-sm">返回队员名录</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/players" className="inline-flex items-center gap-1 text-sm text-text-sub hover:text-text-main mb-6">
        <ArrowLeft size={16} /> 返回队员名录
      </Link>

      {/* 顶部信息卡 */}
      <div className="bg-white rounded-2xl card-shadow p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        {/* 照片 */}
        <div className="w-32 h-32 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <User size={56} className="text-gray-300" />
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-text-main">{player.name}</h1>
            {player.jersey_number && <span className="text-lg text-text-sub">#{player.jersey_number}</span>}
            {player.is_captain === 1 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">现任队长</span>
            )}
            {player.is_former_captain === 1 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">历届队长</span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-sub text-xs">位置</p>
              <p className="font-medium text-text-main">{player.position || '-'}</p>
            </div>
            <div>
              <p className="text-text-sub text-xs">学院</p>
              <p className="font-medium text-text-main">{player.college || '-'}</p>
            </div>
            <div>
              <p className="text-text-sub text-xs">入队年份</p>
              <p className="font-medium text-text-main">{player.join_year ? `${player.join_year} 年` : '-'}</p>
            </div>
            <div>
              <p className="text-text-sub text-xs">状态</p>
              <p className="font-medium text-text-main">{player.status === 'active' ? '现役' : '历届'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 个人简介 */}
      <div className="bg-white rounded-2xl card-shadow p-6 mt-4">
        <h2 className="font-semibold text-text-main mb-2">个人简介</h2>
        <p className="text-sm text-text-sub leading-relaxed whitespace-pre-wrap">{player.bio || '暂无简介'}</p>
      </div>

      {/* 寄语 */}
      <div className="bg-white rounded-2xl card-shadow p-6 mt-4">
        <h2 className="font-semibold text-text-main mb-2">寄语</h2>
        <p className="text-sm text-text-sub leading-relaxed whitespace-pre-wrap">{player.message || '暂无寄语'}</p>
      </div>
    </div>
  );
}
