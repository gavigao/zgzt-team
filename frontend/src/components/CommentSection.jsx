import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, MessageSquareReply, MoreHorizontal, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createComment, deleteComment, getComments, toggleLike } from '../api/comments';
import UserAvatar from './UserAvatar';

function CommentCard({
  comment,
  isReply = false,
  user,
  isAdmin,
  openMenuId,
  onToggleMenu,
  onDelete,
  onLike,
  onReply,
}) {
  if (comment.is_deleted) {
    return (
      <div className={`${isReply ? 'bg-white' : 'bg-gray-50/80'} rounded-xl p-3.5`}>
        <p className="text-sm italic text-text-sub">该评论已删除</p>
      </div>
    );
  }

  return (
    <div className={`${isReply ? 'bg-white border border-gray-100' : 'bg-gray-50/80'} rounded-xl p-3.5 flex gap-3`}>
      <UserAvatar src={comment.avatar_url} name={comment.username} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2 mb-1">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-main [overflow-wrap:anywhere]">{comment.username}</p>
            <p className="text-xs text-text-sub mt-0.5">
              {comment.created_at?.replace('T', ' ').substring(0, 16)}
            </p>
          </div>
          {(user?.id === comment.user_id || isAdmin) && (
            <div className="relative ml-auto shrink-0">
              <button
                type="button"
                onClick={() => onToggleMenu(comment.id)}
                className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-full text-gray-400 hover:text-text-main hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`操作 ${comment.username} 的评论`}
                aria-expanded={openMenuId === comment.id}
              >
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>
              {openMenuId === comment.id && (
                <div className="absolute right-0 top-9 z-10 w-32 rounded-xl border border-gray-100 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => onDelete(comment.id)}
                    className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-red-500 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <Trash2 size={15} aria-hidden="true" /> 删除评论
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-text-main whitespace-pre-wrap leading-relaxed mt-2 [overflow-wrap:anywhere]">
          {comment.content}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onLike(comment)}
            className={`min-h-11 px-2.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${comment.liked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
            aria-label={`${comment.liked ? '取消点赞' : '点赞'}，当前 ${comment.like_count || 0} 个赞`}
            aria-pressed={Boolean(comment.liked)}
          >
            <Heart size={15} className={comment.liked ? 'fill-red-500' : ''} aria-hidden="true" />
            <span>{comment.like_count || 0}</span>
          </button>
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="min-h-11 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-secondary hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <MessageSquareReply size={15} aria-hidden="true" /> 回复
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ matchId }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const textareaRef = useRef(null);

  const loadComments = useCallback(async () => {
    try {
      const response = await getComments(matchId);
      setComments(response.data);
    } catch {
      setError('评论加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const commentTree = useMemo(() => {
    const roots = [];
    const rootMap = new Map();

    comments.forEach(comment => {
      if (!comment.parent_id) {
        const root = { ...comment, replies: [] };
        roots.push(root);
        rootMap.set(Number(comment.id), root);
      }
    });

    comments.forEach(comment => {
      if (!comment.parent_id) return;
      const root = rootMap.get(Number(comment.parent_id));
      if (root) root.replies.push(comment);
      else roots.push({ ...comment, replies: [] });
    });

    roots.sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
    roots.forEach(root => {
      root.replies.sort((left, right) => new Date(left.created_at) - new Date(right.created_at));
    });
    return roots;
  }, [comments]);

  const visibleCommentCount = comments.filter(comment => !comment.is_deleted).length;

  const handleSubmit = async event => {
    event.preventDefault();
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await createComment(matchId, content.trim(), replyingTo?.id || null);
      setContent('');
      setReplyingTo(null);
      await loadComments();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('确定删除这条评论？已有回复的主评论会保留删除占位。')) return;
    try {
      await deleteComment(id);
      setOpenMenuId(null);
      if (replyingTo?.id === id) setReplyingTo(null);
      await loadComments();
    } catch (deleteError) {
      window.alert(deleteError.message);
    }
  };

  const handleLike = async comment => {
    if (!user) {
      window.alert('请先登录后再点赞');
      return;
    }
    try {
      const response = await toggleLike(comment.id);
      setComments(current => current.map(item => (
        item.id === comment.id
          ? { ...item, liked: response.data.liked, like_count: response.data.like_count }
          : item
      )));
    } catch (likeError) {
      window.alert(likeError.message);
    }
  };

  const handleReply = comment => {
    if (!user) {
      window.alert('请先登录后再回复');
      return;
    }
    setReplyingTo({ id: comment.id, username: comment.username });
    setError('');
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(item => <div key={item} className="skeleton h-16 rounded-xl" />)}
      </div>
    );
  }

  const sharedCardProps = {
    user,
    isAdmin,
    openMenuId,
    onToggleMenu: id => setOpenMenuId(value => value === id ? null : id),
    onDelete: handleDelete,
    onLike: handleLike,
    onReply: handleReply,
  };

  return (
    <div>
      <h3 className="font-semibold text-text-main mb-4 flex items-center gap-2">
        <MessageCircle size={18} aria-hidden="true" />
        评论 ({visibleCommentCount})
      </h3>

      {commentTree.length === 0 ? (
        <p className="text-sm text-text-sub text-center py-6">暂无评论，来发表第一条吧</p>
      ) : (
        <div className="space-y-4 mb-6">
          {commentTree.map(comment => (
            <article key={comment.id}>
              <CommentCard comment={comment} {...sharedCardProps} />
              {comment.replies.length > 0 && (
                <div className="ml-5 sm:ml-10 mt-2 pl-3 sm:pl-4 border-l-2 border-gray-100 space-y-2">
                  {comment.replies.map(reply => (
                    <CommentCard key={reply.id} comment={reply} isReply {...sharedCardProps} />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="flex items-start gap-3">
          <UserAvatar src={user.avatar_url} name={user.username} size="sm" />
          <div className="flex-1 min-w-0 space-y-2">
            {replyingTo && (
              <div className="min-h-11 px-3 rounded-xl bg-blue-50 text-secondary flex items-center gap-2 text-sm" role="status" aria-live="polite">
                <MessageSquareReply size={16} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">回复 {replyingTo.username}</span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="w-11 h-11 -mr-3 inline-flex items-center justify-center rounded-xl hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                  aria-label="取消回复"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
            )}

            {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
            <label htmlFor="match-comment-input" className="sr-only">
              {replyingTo ? `回复 ${replyingTo.username}` : '发表评论'}
            </label>
            <textarea
              ref={textareaRef}
              id="match-comment-input"
              value={content}
              onChange={event => setContent(event.target.value)}
              placeholder={replyingTo ? `回复 ${replyingTo.username}...` : '写下你的评论...'}
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-sub">{content.length}/1000</span>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="min-h-11 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              >
                {submitting ? '发表中...' : replyingTo ? '发表回复' : '发表评论'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-text-sub">
          <Link to="/login" className="text-secondary hover:underline font-medium">登录</Link>
          {' '}后即可发表评论和回复
        </div>
      )}
    </div>
  );
}
