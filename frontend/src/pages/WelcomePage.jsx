import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function WelcomePage() {
  const { user, updateUsername, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = username.trim();
    const length = Array.from(value).length;
    setError('');

    if (length < 2 || length > 20) {
      setError('用户名需要 2-20 个字符');
      return;
    }

    setSubmitting(true);
    try {
      await updateUsername(value);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || '用户名设置失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl card-shadow p-7 sm:p-10 text-center">
        <div className="text-5xl mb-5">⚽</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main leading-relaxed">
          欢迎各位新老球星的到来。
        </h1>
        <p className="mt-4 text-lg font-medium text-primary">
          请首先为你的账户取一个响亮的用户名吧。
        </p>
        <p className="mt-2 text-sm text-text-sub">
          欢迎在这个球队社区畅所欲言
        </p>

        <form onSubmit={handleSubmit} className="mt-8 text-left space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">
              你的用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="2-20 个字符，支持中文、字母、数字和符号"
              maxLength={20}
              autoFocus
            />
            <p className="mt-1.5 text-xs text-text-sub">用户名可以重复，以后也可以随时修改。</p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '保存中...' : '开启球队社区'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 text-xs text-text-sub hover:text-primary transition-colors"
        >
          切换账号
        </button>
      </div>
    </div>
  );
}
