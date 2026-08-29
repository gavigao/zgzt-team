import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComments, createComment, deleteComment, toggleLike } from '../api/comments';
import { Trash2, MessageCircle, Heart, MoreHorizontal } from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function CommentSection({ matchId }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const loadComments = useCallback(async () => {
    try {
      const res = await getComments(matchId);
      setComments(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [matchId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await createComment(matchId, content.trim());
      setComments(prev => [res.data, ...prev]);
      setContent('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除这条评论？')) return;
    try {
      await deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLike = async (comment) => {
    if (!user) {
      alert('请先登录后再点赞');
      return;
    }
    try {
      const res = await toggleLike(comment.id);
      setComments(prev => prev.map(c =>
        c.id === comment.id ? { ...c, liked: res.data.liked, like_count: res.data.like_count } : c
      ));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-text-main mb-4 flex items-center gap-2">
        <MessageCircle size={18} />
        评论 ({comments.length})
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-text-sub text-center py-6">暂无评论，来发表第一条吧</p>
      ) : (
        <div className="space-y-3 mb-6">
          {comments.map(c => (
            <div key={c.id} className="bg-gray-50/80 rounded-xl p-3.5 flex gap-3">
              <UserAvatar src={c.avatar_url} name={c.username} size="sm" />
              <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2 mb-1">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-main truncate">{c.username}</p>
                  <p className="text-[11px] text-text-sub mt-0.5">{c.created_at?.replace('T', ' ').substring(0, 16)}</p>
                </div>
                  {(user?.id === c.user_id || isAdmin) && (
                    <div className="relative ml-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(value => value === c.id ? null : c.id)}
                        className="min-w-10 min-h-10 -mr-2 -mt-2 flex items-center justify-center rounded-full text-gray-400 hover:text-text-main hover:bg-gray-100"
                        aria-label="评论操作"
                        aria-expanded={openMenuId === c.id}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {openMenuId === c.id && (
                        <div className="absolute right-0 top-8 z-10 w-28 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} /> 删除评论
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
              <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed mt-2">{c.content}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  onClick={() => handleLike(c)}
                  className={`min-h-10 px-2 rounded-lg flex items-center gap-1.5 text-xs transition-colors ${c.liked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                  aria-pressed={!!c.liked}
                >
                  <Heart size={14} className={c.liked ? 'fill-red-500' : ''} />
                  <span>{c.like_count || 0}</span>
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="flex items-start gap-3">
          <UserAvatar src={user.avatar_url} name={user.username} size="sm" />
          <div className="flex-1 min-w-0 space-y-2">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="写下你的评论..."
            maxLength={1000}
            rows={3}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-sub">{content.length}/1000</span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '发表中...' : '发表评论'}
            </button>
          </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-text-sub">
          <Link to="/login" className="text-secondary hover:underline font-medium">登录</Link>
          {' '}后即可发表评论
        </div>
      )}
    </div>
  );
}
