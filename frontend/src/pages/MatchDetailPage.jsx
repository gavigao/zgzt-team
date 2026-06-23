import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchById } from '../api/public';
import CommentSection from '../components/CommentSection';
import { CalendarDays, Trophy, ArrowLeft } from 'lucide-react';

export default function MatchDetailPage() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMatchById(id)
      .then(res => setMatch(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-sub">比赛不存在</p>
        <Link to="/matches" className="text-secondary hover:underline text-sm mt-2 inline-block">返回比赛列表</Link>
      </div>
    );
  }

  const isWin = match.our_score > match.opponent_score;
  const isDraw = match.our_score === match.opponent_score;
  const hasScore = match.our_score !== null && match.opponent_score !== null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* 返回链接 */}
      <Link to="/matches" className="inline-flex items-center gap-1 text-sm text-text-sub hover:text-text-main mb-6 transition-colors">
        <ArrowLeft size={16} /> 返回比赛列表
      </Link>

      {/* 比分卡 */}
      <div className="bg-white rounded-2xl card-shadow p-6 mb-6">
        <div className="flex items-center justify-between text-xs text-text-sub mb-4">
          {match.competition ? (
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
              match.competition === '新生赛' ? 'bg-blue-50 text-secondary' : 'bg-red-50 text-primary'
            }`}>
              {match.competition}{match.stage ? ` · ${match.stage}` : ''}
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1"><CalendarDays size={12} />{match.match_date}</span>
        </div>

        <div className="flex items-center justify-between">
          {/* 主队 */}
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-text-main">政国中统</p>
          </div>

          {/* 比分 */}
          <div className="mx-6 flex-shrink-0 text-center">
            {hasScore ? (
              <>
                <div className="flex items-center gap-3">
                  <span className={`text-4xl lg:text-5xl font-bold tabular-nums ${
                    isWin ? 'text-primary' : isDraw ? 'text-amber-500' : 'text-text-sub'
                  }`}>
                    {match.our_score}
                  </span>
                  <span className="text-2xl text-gray-300 font-light">:</span>
                  <span className="text-4xl lg:text-5xl font-bold text-text-sub tabular-nums">
                    {match.opponent_score}
                  </span>
                </div>
                <div className="mt-2">
                  {isWin && <span className="text-sm font-medium text-white bg-primary px-3 py-0.5 rounded-full">胜利</span>}
                  {isDraw && <span className="text-sm font-medium text-white bg-amber-500 px-3 py-0.5 rounded-full">平局</span>}
                  {!isWin && !isDraw && <span className="text-sm font-medium text-white bg-gray-400 px-3 py-0.5 rounded-full">失利</span>}
                </div>
              </>
            ) : (
              <span className="text-xl font-bold text-text-sub">VS</span>
            )}
          </div>

          {/* 客队 */}
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-text-main">{match.opponent}</p>
          </div>
        </div>
      </div>

      {/* 赛后总结 */}
      {match.summary && (
        <div className="bg-white rounded-2xl card-shadow p-6 mb-6">
          <h2 className="font-semibold text-text-main mb-3 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" /> 赛后总结
          </h2>
          <div className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
            {match.summary}
          </div>
        </div>
      )}

      {/* 评论区 */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <CommentSection matchId={parseInt(id)} />
      </div>
    </div>
  );
}
