import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLLEGE_COLORS = {
  '政管': 'bg-blue-100 text-blue-700',
  '国关': 'bg-red-100 text-red-700',
  '中文': 'bg-green-100 text-green-700',
  '统计': 'bg-purple-100 text-purple-700',
};

export default function PlayerCard({ player }) {
  return (
    <Link
      to={`/players/${player.id}`}
      className="bg-white rounded-2xl card-shadow p-5 flex flex-col items-center text-center hover:scale-[1.02] transition-transform"
    >
      {/* 照片 */}
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3 overflow-hidden">
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <User size={32} className="text-gray-300" />
        )}
      </div>

      {/* 姓名 + 号码 */}
      <h3 className="font-semibold text-text-main">
        {player.name}
        {player.jersey_number && (
          <span className="ml-1.5 text-xs text-text-sub font-normal">#{player.jersey_number}</span>
        )}
      </h3>

      {/* 位置 */}
      <p className="text-xs text-text-sub mt-0.5">{player.position || '-'}</p>

      {/* 学院标签 */}
      <span
        className={`mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
          COLLEGE_COLORS[player.college] || 'bg-gray-100 text-gray-600'
        }`}
      >
        {player.college || '未知'}
      </span>

      {/* 队长标识 */}
      {player.is_captain === 1 && (
        <span className="mt-1.5 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          队长
        </span>
      )}

      {/* 入学年份 */}
      {player.grade && (
        <p className="text-xs text-text-sub mt-2">{player.grade} 级</p>
      )}
    </Link>
  );
}
