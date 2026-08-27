import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import {
  createBoardComment,
  createBoardPost,
  deleteBoardComment,
  deleteBoardPost,
  getBoardComments,
  getBoardPosts,
  toggleBoardPostLike,
} from '../api/board';

function formatTime(value) {
  return value ? value.replace('T', ' ').substring(0, 16) : '';
}

function PostComments({ post, onCountChange }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBoardComments(post.id)
      .then(res => setComments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [post.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await createBoardComment(post.id, content.trim());
      setComments(prev => [...prev, res.data]);
      onCountChange(1);
      setContent('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (comment) => {
    if (!confirm('确定删除这条评论？')) return;
    try {
      await deleteBoardComment(comment.id);
      setComments(prev => prev.filter(item => item.id !== comment.id));
      onCountChange(-1);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {loading ? (
        <div className="skeleton h-14 rounded-xl" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-text-sub text-center py-3">还没有评论，来接第一句话吧</p>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-2.5 bg-gray-50 rounded-xl p-3">
              <UserAvatar src={comment.avatar_url} name={comment.username} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-main">{comment.username}</span>
                  <span className="text-xs text-text-sub">{formatTime(comment.created_at)}</span>
                  {(user?.id === comment.user_id || isAdmin) && (
                    <button
                      onClick={() => handleDelete(comment)}
                      className="ml-auto text-gray-400 hover:text-red-500"
                      aria-label="删除评论"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-text-main whitespace-pre-wrap break-words mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={content}
            onChange={event => setContent(event.target.value)}
            maxLength={1000}
            placeholder="回复这篇帖子..."
            className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-3 py-2 bg-primary text-white rounded-xl disabled:opacity-50"
            aria-label="发表评论"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <p className="text-xs text-text-sub text-center">
          <Link to="/login" className="text-secondary hover:underline">登录</Link> 后参与评论
        </p>
      )}
    </div>
  );
}

export default function BoardPage() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const limit = 10;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBoardPosts({ page, limit });
      setPosts(res.data.list);
      setTotal(res.data.total);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await createBoardPost({ title: title.trim(), content: content.trim() });
      if (page === 1) setPosts(prev => [res.data, ...prev]);
      else setPage(1);
      setTotal(value => value + 1);
      setTitle('');
      setContent('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (post) => {
    if (!user) {
      alert('请先登录后再点赞');
      return;
    }
    try {
      const res = await toggleBoardPostLike(post.id);
      setPosts(prev => prev.map(item => item.id === post.id
        ? { ...item, liked: res.data.liked, like_count: res.data.like_count }
        : item));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (post) => {
    if (!confirm('确定删除这篇帖子以及下面的全部评论？')) return;
    try {
      await deleteBoardPost(post.id);
      setPosts(prev => prev.filter(item => item.id !== post.id));
      setTotal(value => Math.max(value - 1, 0));
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleComments = (postId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const updateCommentCount = (postId, delta) => {
    setPosts(prev => prev.map(item => item.id === postId
      ? { ...item, comment_count: Math.max((item.comment_count || 0) + delta, 0) }
      : item));
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main">球队留言板</h1>
      <p className="text-sm text-text-sub mt-1 mb-6">聊比赛、约球、整活都可以。点赞只显示数量，评论会显示用户名。</p>

      {user ? (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl card-shadow p-5 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar src={user.avatar_url} name={user.username} />
            <div>
              <p className="text-sm font-medium text-text-main">{user.username}</p>
              <p className="text-xs text-text-sub">今天想和大家说点什么？</p>
            </div>
          </div>
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            maxLength={120}
            placeholder="给帖子起个标题"
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <textarea
            value={content}
            onChange={event => setContent(event.target.value)}
            maxLength={5000}
            rows={4}
            placeholder="比赛复盘、训练约人、装备交流，或者单纯整点活……"
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-sub">{content.length}/5000</span>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl disabled:opacity-50"
            >
              {submitting ? '发布中...' : '发布帖子'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl card-shadow p-5 mb-6 text-center text-sm text-text-sub">
          先随便看看，想发帖时再 <Link to="/login" className="text-secondary hover:underline">登录</Link>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl card-shadow p-10 text-center">
          <p className="text-3xl mb-2">💬</p>
          <p className="font-medium text-text-main">留言板还是一片新草皮</p>
          <p className="text-sm text-text-sub mt-1">来留下第一篇帖子吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <article key={post.id} className="bg-white rounded-2xl card-shadow p-5">
              <div className="flex gap-3">
                <UserAvatar src={post.avatar_url} name={post.username} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-main">{post.username}</span>
                    <span className="text-xs text-text-sub">{formatTime(post.created_at)}</span>
                    {(user?.id === post.user_id || isAdmin) && (
                      <button
                        onClick={() => handleDelete(post)}
                        className="ml-auto text-gray-400 hover:text-red-500"
                        aria-label="删除帖子"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <h2 className="font-semibold text-text-main mt-2 break-words">{post.title}</h2>
                  <p className="text-sm text-text-main whitespace-pre-wrap break-words mt-2 leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={() => handleLike(post)}
                      className={`flex items-center gap-1 text-sm ${post.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    >
                      <Heart size={17} className={post.liked ? 'fill-red-500' : ''} />
                      {post.like_count || 0}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-secondary"
                    >
                      <MessageCircle size={17} />
                      {post.comment_count || 0}
                    </button>
                  </div>
                </div>
              </div>

              {expanded.has(post.id) && (
                <PostComments
                  post={post}
                  onCountChange={delta => updateCommentCount(post.id, delta)}
                />
              )}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            onClick={() => setPage(value => Math.max(value - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-white rounded-lg card-shadow text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-text-sub">{page}/{totalPages}</span>
          <button
            onClick={() => setPage(value => Math.min(value + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-white rounded-lg card-shadow text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
