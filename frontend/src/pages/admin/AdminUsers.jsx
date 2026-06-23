import { useState, useEffect } from 'react';
import { listUsers, updateUserRole } from '../../api/admin';
import { Shield } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => { try { setUsers((await listUsers()).data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const handleToggleRole = async (user) => {
    if (!confirm(`确定将 ${user.username} ${user.role==='admin'?'降级为队员':'提升为管理员'}？`)) return;
    try {
      await updateUserRole(user.id, user.role === 'admin' ? 'player' : 'admin');
      load();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>;

  return (
    <div>
      <h1 className="text-xl font-bold text-text-main mb-1">用户管理</h1>
      <p className="text-sm text-text-sub mb-4">{users.length} 名注册用户</p>
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-text-sub text-xs">
            <th className="p-3 pl-4">用户名</th><th className="p-3">邮箱</th><th className="p-3">角色</th><th className="p-3">注册时间</th><th className="p-3 pr-4">操作</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-3 pl-4 font-medium flex items-center gap-1.5">{u.username}{u.role==='admin'&&<Shield size={13} className="text-primary"/>}</td>
                <td className="p-3 text-text-sub">{u.email||'-'}</td>
                <td className="p-3"><span className={`text-xs px-1.5 py-0.5 rounded ${u.role==='admin'?'bg-primary/10 text-primary':'bg-gray-100 text-text-sub'}`}>{u.role==='admin'?'管理员':'队员'}</span></td>
                <td className="p-3 text-text-sub text-xs">{u.created_at?.substring(0,10)}</td>
                <td className="p-3 pr-4">
                  <button onClick={()=>handleToggleRole(u)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    {u.role==='admin'?'降级':'升为管理员'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
