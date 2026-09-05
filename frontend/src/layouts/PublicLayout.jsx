import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ChevronDown, LogOut, Shield, Pencil } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

const NAV_ITEMS = [
  { to: '/', label: '首页' },
  { to: '/history', label: '球队历史' },
  { to: '/players', label: '队员名录' },
  { to: '/matches', label: '比赛记录' },
  { to: '/honors', label: '荣誉墙' },
  { to: '/news', label: '新闻' },
  { to: '/photos', label: '照片墙' },
  { to: '/training', label: '训练' },
  { to: '/board', label: '留言板' },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const canAccessBackstage = isAdmin || Boolean(user?.player_id);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col">
      {/* 白色顶部导航栏 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 队名/Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <img
              src="/images/team-crest.png"
              alt=""
              aria-hidden="true"
              width="36"
              height="40"
              className="w-9 h-10 object-contain shrink-0"
            />
            <span className="text-primary">政国中统</span>
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* 右侧：登录/用户 */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:text-primary transition-colors"
                >
                  <UserAvatar src={user.avatar_url} name={user.username} size="sm" />
                  <span className="max-w-[80px] truncate">{user.username || user.account}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      {canAccessBackstage && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Shield size={16} className="text-primary" />
                          {isAdmin ? '管理后台' : '我的队员资料'}
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={16} className="text-secondary" />
                        账户资料
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut size={16} />
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                登录
              </Link>
            )}
          </div>

          {/* 移动端汉堡 */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-11 h-11 inline-flex items-center justify-center text-gray-600 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            aria-label={mobileOpen ? '关闭导航菜单' : '打开导航菜单'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 移动端菜单 */}
        {mobileOpen && (
          <nav id="mobile-navigation" className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-0.5 shadow-lg max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-red-50'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-100">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                    <UserAvatar src={user.avatar_url} name={user.username} size="sm" />
                    {user.username || user.account}
                    {isAdmin && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">管理员</span>}
                  </div>
                  {canAccessBackstage && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-primary hover:bg-gray-50"
                    >
                      <Shield size={16} aria-hidden="true" /> {isAdmin ? '管理后台' : '我的队员资料'}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-primary hover:bg-gray-50"
                  >
                    <Pencil size={16} aria-hidden="true" /> 账户资料
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-primary hover:bg-gray-50"
                  >
                    <LogOut size={16} aria-hidden="true" /> 退出登录
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-primary"
                >
                  登录
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* 页面内容 */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-1.5 text-sm font-bold mb-3">
            <img
              src="/images/team-crest.png"
              alt=""
              aria-hidden="true"
              width="48"
              height="54"
              loading="lazy"
              className="w-12 h-[54px] object-contain"
            />
            <span className="text-primary">政国中统联队</span>
          </div>
          <p className="text-xs text-gray-400 mb-1">
            政管·国关·文传·统计
          </p>
          <p className="text-xs text-gray-300">© 2019 - {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
