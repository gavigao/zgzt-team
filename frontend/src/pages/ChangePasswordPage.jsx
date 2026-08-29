import { useState } from 'react';
import { Eye, EyeOff, KeyRound, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PasswordField({ id, label, value, onChange, autoComplete, visible, onToggle }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-main mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={event => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="w-full min-h-11 px-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-0 top-0 w-11 h-11 inline-flex items-center justify-center text-gray-400 hover:text-text-main rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label={visible ? `隐藏${label}` : `显示${label}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) return setError('请完整填写三个密码框');
    if (newPassword.length < 8) return setError('新密码至少需要 8 个字符');
    if (newPassword !== confirmPassword) return setError('两次输入的新密码不一致');

    setSubmitting(true);
    try {
      const nextUser = await changePassword(currentPassword, newPassword);
      navigate(nextUser.username ? (nextUser.player_id ? '/admin/my-player' : '/') : '/welcome', { replace: true });
    } catch (err) {
      setError(err.message || '密码修改失败，请重试');
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
      <div className="w-full max-w-md bg-white rounded-2xl card-shadow p-6 sm:p-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <KeyRound size={24} aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-text-main">设置你的新密码</h1>
        <p className="mt-2 text-sm text-text-sub leading-6">
          {user?.must_change_password
            ? '这是首次登录或密码刚被重置。修改完成后即可进入球队社区。'
            : '输入当前密码，再设置一个只有你知道的新密码。'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-lg">{error}</div>}
          <PasswordField id="current-password" label="当前密码" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" visible={visible.current} onToggle={() => setVisible(state => ({ ...state, current: !state.current }))} />
          <PasswordField id="new-password" label="新密码" value={newPassword} onChange={setNewPassword} autoComplete="new-password" visible={visible.next} onToggle={() => setVisible(state => ({ ...state, next: !state.next }))} />
          <PasswordField id="confirm-password" label="确认新密码" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" visible={visible.confirm} onToggle={() => setVisible(state => ({ ...state, confirm: !state.confirm }))} />
          <p className="text-xs text-text-sub">至少 8 个字符；不要继续使用初始密码 12345678。</p>
          <button type="submit" disabled={submitting} className="w-full min-h-11 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? '保存中...' : '保存新密码并继续'}
          </button>
        </form>

        <button type="button" onClick={handleLogout} className="mt-4 min-h-11 w-full inline-flex items-center justify-center gap-2 text-sm text-text-sub hover:text-primary rounded-xl">
          <LogOut size={16} aria-hidden="true" /> 切换账号
        </button>
      </div>
    </div>
  );
}
