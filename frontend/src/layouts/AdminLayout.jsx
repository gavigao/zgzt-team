import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Swords, Newspaper, Trophy,
  Images, CalendarDays, UserCog, Settings, LogOut,
  ArrowLeft, Menu, X,
} from 'lucide-react';

const ADMIN_MENU = [
  { to: '/admin', label: '仪表盘', icon: LayoutDashboard, end: true },
  { to: '/admin/players', label: '队员管理', icon: Users },
  { to: '/admin/matches', label: '比赛管理', icon: Swords },
  { to: '/admin/news', label: '新闻管理', icon: Newspaper },
  { to: '/admin/honors', label: '荣誉管理', icon: Trophy },
  { to: '/admin/photos', label: '照片管理', icon: Images },
  { to: '/admin/training', label: '训练管理', icon: CalendarDays },
  { to: '/admin/users', label: '管理员管理', icon: UserCog, ownerOnly: true },
  { to: '/admin/settings', label: '网站设置', icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isOwner } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg-main flex">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧边栏 */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-60 bg-white border-r border-gray-100 flex flex-col
          transition-transform lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
          <Link to="/" className="font-bold text-sm flex items-center gap-2">
            <span className="text-primary">⚽</span>
            <span className="text-primary">政国中统</span>
            <span className="text-secondary text-xs">联队</span>
          </Link>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* 菜单 */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {ADMIN_MENU.filter(item => !item.ownerOnly || isOwner).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-primary'
                    : 'text-gray-500 hover:text-primary hover:bg-red-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* 底部操作 */}
        <div className="border-t border-white/10 px-3 py-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-primary hover:bg-red-50 transition-colors"
          >
            <ArrowLeft size={18} />
            返回前台
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-primary hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>

      {/* 右侧内容区 */}
      <div className="flex-1 min-w-0">
        {/* 移动端顶栏 */}
        <header className="lg:hidden h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-gray-600 hover:text-gray-900"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-sm text-text-main">管理后台</span>
          <span className="ml-auto text-xs text-text-sub">{user?.username}</span>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
