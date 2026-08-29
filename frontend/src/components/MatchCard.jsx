import { Link } from 'react-router-dom';

export default function MatchCard({ match }) {
  const isWin = match.our_score > match.opponent_score;
  const isDraw = match.our_score === match.opponent_score;
  const hasScore = match.our_score !== null && match.opponent_score !== null;

  return (
    <Link
      to={`/matches/${match.id}`}
      className="group block bg-white rounded-2xl card-shadow p-4 sm:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* 赛事类型 + 阶段 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {match.competition ? (
          <span className={`max-w-[65%] text-xs font-medium px-2 py-1 rounded ${
            match.competition === '新生赛' ? 'bg-blue-50 text-secondary' : 'bg-red-50 text-primary'
          }`}>
            {match.competition}{match.stage ? ` · ${match.stage}` : ''}
          </span>
        ) : (
          <span />
        )}
        <span className="shrink-0 text-xs text-text-sub tabular-nums">{match.match_date}</span>
      </div>

      {/* 对阵双方 + 比分 */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 text-right">
          <p className="font-semibold text-text-main leading-6 break-words">政国中统</p>
        </div>

        {/* 比分 */}
        <div className="mx-1.5 sm:mx-5 flex-shrink-0 text-center">
          {hasScore ? (
            <div className="flex items-center gap-2">
              <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                isWin ? 'text-primary' : isDraw ? 'text-amber-500' : 'text-text-sub'
              }`}>
                {match.our_score}
              </span>
              <span className="text-xl text-gray-300 font-light">:</span>
              <span className="text-2xl sm:text-3xl font-bold text-text-sub tabular-nums">
                {match.opponent_score}
              </span>
            </div>
        ) : (
            <div>
              <span className="text-lg font-semibold text-secondary">VS</span>
              <span className="text-xs text-secondary font-medium mt-1 block">待赛</span>
            </div>
          )}
          {isWin && hasScore && (
            <span className="text-xs text-primary font-medium mt-1 block">胜利</span>
          )}
          {isDraw && hasScore && (
            <span className="text-xs text-amber-500 font-medium mt-1 block">平局</span>
          )}
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-text-main leading-6 break-words">{match.opponent}</p>
        </div>
      </div>

      {/* 摘要 */}
      {match.summary && (
        <p className="mt-4 text-xs leading-5 text-text-sub line-clamp-2 border-t border-gray-100 pt-3">
          {match.summary.replace(/[#*`>-]/g, '').substring(0, 80)}
        </p>
      )}
    </Link>
  );
}
