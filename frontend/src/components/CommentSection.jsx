import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComments, createComment, deleteComment, toggleLike } from '../api/comments';
import { Trash2, MessageCircle, Heart } from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function CommentSection({ matchId }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
            <div key={c.id} className="bg-gray-50 rounded-xl p-3 flex gap-2.5">
              <UserAvatar src={c.avatar_url} name={c.username} size="sm" />
              <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-main">{c.username}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-sub">{c.created_at?.substring(0, 16)}</span>
                  {(user?.id === c.user_id || isAdmin) && (
                    <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-text-main whitespace-pre-wrap">{c.content}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  onClick={() => handleLike(c)}
                  className={`flex items-center gap-1 text-xs transition-colors ${c.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
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
        <form onSubmit={handleSubmit} className="space-y-2">
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
