import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function ProfilePage() {
  const { user, updateUsername, updateAvatar } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const savedUsername = user?.username || '';

  const chooseAvatar = event => {
    const file = event.target.files?.[0];
    setAvatarError('');
    setAvatarMessage('');
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError('头像仅支持 JPG、PNG、GIF 或 WebP');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('头像不能超过 5 MB');
      event.target.value = '';
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    setAvatarError('');
    setAvatarMessage('');
    try {
      await updateAvatar(avatarFile);
      setAvatarFile(null);
      setAvatarPreview('');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      setAvatarMessage('头像已更新，去留言板亮个相吧');
    } catch (err) {
      setAvatarError(err.message || '头像上传失败，请重试');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const cancelAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarError('');
    setAvatarMessage('');
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const value = username.trim();
    const length = Array.from(value).length;
    setUsernameError('');
    setUsernameMessage('');

    if (length < 2 || length > 20) {
      setUsernameError('用户名需要 2-20 个字符');
      return;
    }

    setSubmitting(true);
    try {
      await updateUsername(value);
      setUsernameMessage('用户名已更新');
    } catch (err) {
      setUsernameError(err.message || '用户名更新失败，请重试');
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
          <p className="mt-1 text-sm text-text-sub">登录账号不可修改，头像和公开用户名可以随时更换。</p>

          <section className="mt-6 pb-6 border-b border-gray-100">
            {avatarError && <div className="mb-4 bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-lg">{avatarError}</div>}
            {avatarMessage && <div className="mb-4 bg-green-50 text-green-700 text-sm px-3 py-2.5 rounded-lg">{avatarMessage}</div>}
            <div className="flex items-center gap-4">
              <UserAvatar
                src={avatarPreview || user?.avatar_url}
                name={user?.username}
                size="xl"
                className="ring-4 ring-gray-50"
              />
              <div className="min-w-0 flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm cursor-pointer">
                  <Camera size={16} /> 选择头像
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={chooseAvatar} className="hidden" />
                </label>
                <p className="text-xs text-text-sub mt-2">巨星头像、表情包、整活图都欢迎，单张不超过 5 MB。</p>
                {avatarFile && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="px-3 py-2 bg-secondary text-white text-sm rounded-xl disabled:opacity-50"
                    >
                      {uploadingAvatar ? '上传中...' : '保存新头像'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelAvatar}
                      disabled={uploadingAvatar}
                      className="px-3 py-2 bg-gray-100 text-text-sub text-sm rounded-xl hover:bg-gray-200 disabled:opacity-50"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

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
            {usernameError && <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-lg">{usernameError}</div>}
            {usernameMessage && <div className="bg-green-50 text-green-700 text-sm px-3 py-2.5 rounded-lg">{usernameMessage}</div>}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">公开用户名</label>
              <input
                type="text"
                value={username}
                onChange={event => setUsername(event.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="2-20 个字符"
                maxLength={20}
              />
              <p className="mt-1.5 text-xs text-text-sub">支持中文、字母、数字和符号，允许与他人重名。</p>
            </div>
            <button
              type="submit"
              disabled={submitting || username.trim() === savedUsername}
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
