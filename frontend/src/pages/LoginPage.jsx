import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 登录成功后跳转到之前想去的页面，或首页
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!account.trim() || !password) {
      setError('请填写账号和密码');
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(account.trim(), password);
      navigate(
        loggedInUser.must_change_password
          ? '/change-password'
          : (loggedInUser.username ? from : '/welcome'),
        { replace: true }
      );
    } catch (err) {
      setError(err.message || '登录失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl">⚽</Link>
          <h1 className="mt-3 text-xl font-bold text-text-main">政国中统联队</h1>
          <p className="mt-1 text-sm text-text-sub">登录球队网站</p>
        </div>

        {/* 表单卡片 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl card-shadow p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">账号</label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="请输入账号"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl
              hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-text-sub">
          还没有账号？
          <Link to="/register" className="text-secondary hover:underline ml-1 font-medium">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
