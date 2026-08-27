import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ChevronDown, LogOut, Shield, User, Pencil } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: '首页' },
  { to: '/history', label: '球队历史' },
  { to: '/players', label: '队员名录' },
  { to: '/matches', label: '比赛记录' },
  { to: '/honors', label: '荣誉墙' },
  { to: '/news', label: '新闻' },
  { to: '/photos', label: '照片墙' },
  { to: '/training', label: '训练' },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
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
            <span className="text-2xl">⚽</span>
            <span className="text-primary">政国中统</span>
            <span className="text-secondary text-sm font-medium hidden sm:inline">联队</span>
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
                  <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
                    <User size={13} className="text-secondary" />
                  </div>
                  <span className="max-w-[80px] truncate">{user.username || user.account}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Shield size={16} className="text-primary" />
                          管理后台
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={16} className="text-secondary" />
                        修改用户名
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
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-primary"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 移动端菜单 */}
        {mobileOpen && (
          <nav className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-0.5 shadow-lg">
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
                    <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
                      <User size={13} className="text-secondary" />
                    </div>
                    {user.username || user.account}
                    {isAdmin && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">管理员</span>}
                  </div>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-primary hover:bg-gray-50"
                    >
                      🛡️ 管理后台
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-primary hover:bg-gray-50"
                  >
                    ✏️ 修改用户名
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-primary hover:bg-gray-50"
                  >
                    🚪 退出登录
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
          <div className="flex items-center justify-center gap-2 text-sm font-bold mb-2">
            <span className="text-primary">⚽ 政国中统联队</span>
          </div>
          <p className="text-xs text-gray-400 mb-1">
            对外经济贸易大学 · 政府管理学院 · 国际关系学院 · 中文学院 · 统计学院
          </p>
          <p className="text-xs text-gray-300">© 2019 - {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
