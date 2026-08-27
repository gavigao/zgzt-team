import { useEffect, useState } from 'react';
import { Crown, Shield } from 'lucide-react';
import { listUsers, updateUserRole } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';

const ROLE_META = {
  owner: { label: '总负责人', className: 'bg-amber-50 text-amber-700' },
  admin: { label: '管理员', className: 'bg-primary/10 text-primary' },
  player: { label: '队员', className: 'bg-gray-100 text-text-sub' },
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setUsers((await listUsers()).data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggleRole = async (target) => {
    const nextRole = target.role === 'admin' ? 'player' : 'admin';
    const action = nextRole === 'admin' ? '任命为管理员' : '撤销管理员权限';
    if (!confirm(`确定将 ${target.username || target.account} ${action}？`)) return;

    try {
      await updateUserRole(target.id, nextRole);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-text-main mb-1">管理员管理</h1>
      <p className="text-sm text-text-sub mb-4">只有总负责人可以任命或撤销管理员；操作不会删除用户账户。</p>

      <div className="bg-white rounded-2xl card-shadow overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-left text-text-sub text-xs">
              <th className="p-3 pl-4">用户</th>
              <th className="p-3">账号</th>
              <th className="p-3">角色</th>
              <th className="p-3">注册时间</th>
              <th className="p-3 pr-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(target => {
              const meta = ROLE_META[target.role] || ROLE_META.player;
              const locked = target.role === 'owner' || target.id === currentUser?.id;

              return (
                <tr key={target.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-2">
                      <UserAvatar src={target.avatar_url} name={target.username} size="sm" />
                      <span className="font-medium">{target.username || '未设置用户名'}</span>
                      {target.role === 'owner' && <Crown size={14} className="text-amber-500" />}
                      {target.role === 'admin' && <Shield size={14} className="text-primary" />}
                    </div>
                  </td>
                  <td className="p-3 text-text-sub">{target.account}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${meta.className}`}>{meta.label}</span>
                  </td>
                  <td className="p-3 text-text-sub text-xs">{target.created_at?.substring(0, 10)}</td>
                  <td className="p-3 pr-4">
                    {locked ? (
                      <span className="text-xs text-gray-400">不可修改</span>
                    ) : (
                      <button
                        onClick={() => handleToggleRole(target)}
                        className="text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {target.role === 'admin' ? '撤销管理员' : '任命管理员'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
