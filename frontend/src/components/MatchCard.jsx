import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function MatchCard({ match }) {
  const isWin = match.our_score > match.opponent_score;
  const isDraw = match.our_score === match.opponent_score;
  const hasScore = match.our_score !== null && match.opponent_score !== null;

  return (
    <Link
      to={`/matches/${match.id}`}
      className="bg-white rounded-2xl card-shadow p-5 block hover:scale-[1.01] transition-transform"
    >
      {/* 赛季 + 日期 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-sub">{match.season_name || ''}</span>
        <span className="text-xs text-text-sub">{match.match_date}</span>
      </div>

      {/* 对阵双方 + 比分 */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-right">
          <p className="font-semibold text-text-main">政国中统</p>
          <p className="text-xs text-text-sub mt-0.5">{match.home_away === 'home' ? '主场' : '客场'}</p>
        </div>

        {/* 比分 */}
        <div className="mx-5 flex-shrink-0 text-center">
          {hasScore ? (
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold tabular-nums ${
                isWin ? 'text-primary' : isDraw ? 'text-amber-500' : 'text-text-sub'
              }`}>
                {match.our_score}
              </span>
              <span className="text-xl text-gray-300 font-light">:</span>
              <span className="text-3xl font-bold text-text-sub tabular-nums">
                {match.opponent_score}
              </span>
            </div>
          ) : (
            <span className="text-sm text-text-sub">VS</span>
          )}
          {isWin && hasScore && (
            <span className="text-xs text-primary font-medium mt-1 block">胜利</span>
          )}
          {isDraw && hasScore && (
            <span className="text-xs text-amber-500 font-medium mt-1 block">平局</span>
          )}
        </div>

        <div className="flex-1 text-left">
          <p className="font-semibold text-text-main">{match.opponent}</p>
          {match.location && (
            <p className="text-xs text-text-sub mt-0.5 flex items-center gap-1 justify-start">
              <MapPin size={11} />
              {match.location}
            </p>
          )}
        </div>
      </div>

      {/* 摘要 */}
      {match.summary && (
        <p className="mt-3 text-xs text-text-sub line-clamp-2 border-t border-gray-50 pt-3">
          {match.summary.replace(/[#*`>-]/g, '').substring(0, 80)}
        </p>
      )}
    </Link>
  );
}
