import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUsername } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = username.trim();
    const length = Array.from(value).length;
    setError('');
    setMessage('');

    if (length < 2 || length > 20) {
      setError('用户名需要 2-20 个字符');
      return;
    }

    setSubmitting(true);
    try {
      await updateUsername(value);
      setMessage('用户名已更新');
    } catch (err) {
      setError(err.message || '用户名更新失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main px-4 py-10">
      <div className="max-w-lg mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-sub hover:text-primary mb-4">
          <ArrowLeft size={16} /> 返回首页
        </Link>
        <div className="bg-white rounded-2xl card-shadow p-6 sm:p-8">
          <h1 className="text-xl font-bold text-text-main">账户资料</h1>
          <p className="mt-1 text-sm text-text-sub">登录账号不可修改，公开用户名可以随时更改。</p>

          <div className="mt-6">
            <label className="block text-sm font-medium text-text-main mb-1.5">登录账号</label>
            <input
              type="text"
              value={user?.account || ''}
              disabled
              className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-lg">{error}</div>}
            {message && <div className="bg-green-50 text-green-700 text-sm px-3 py-2.5 rounded-lg">{message}</div>}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">公开用户名</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="2-20 个字符"
                maxLength={20}
              />
              <p className="mt-1.5 text-xs text-text-sub">支持中文、字母、数字和符号，允许与他人重名。</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '保存中...' : '保存用户名'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
