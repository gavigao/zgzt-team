import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedAccount = account.trim().toLowerCase();
    if (!normalizedAccount || !password) {
      setError('请填写账号和密码');
      return;
    }
    if (!/^[a-z0-9_-]{4,32}$/.test(normalizedAccount)) {
      setError('账号需要 4-32 位，只能使用字母、数字、下划线或短横线');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 8) {
      setError('密码至少需要 8 个字符');
      return;
    }

    setSubmitting(true);
    try {
      await register(normalizedAccount, password);
      navigate('/welcome', { replace: true });
    } catch (err) {
      setError(err.message || '注册失败，请重试');
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
          <h1 className="mt-3 text-xl font-bold text-text-main">加入球队</h1>
          <p className="mt-1 text-sm text-text-sub">注册成为政国中统联队的一员</p>
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
              placeholder="手机号、QQ号或容易记住的账号"
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
              placeholder="至少 8 个字符"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="再次输入密码"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl
              hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-text-sub">
          已有账号？
          <Link to="/login" className="text-secondary hover:underline ml-1 font-medium">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
