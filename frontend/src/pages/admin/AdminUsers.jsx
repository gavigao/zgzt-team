import { useEffect, useState } from 'react';
import { Crown, KeyRound, Plus, Shield, Trash2, X } from 'lucide-react';
import { bindUserPlayer, createUser, deleteUser, listPlayers, listUsers, resetUserPassword, updateUserRole } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';

const ROLE_META = {
  owner: { label: '总负责人', className: 'bg-amber-50 text-amber-700' },
  admin: { label: '管理员', className: 'bg-primary/10 text-primary' },
  player: { label: '队员', className: 'bg-gray-100 text-text-sub' },
};
const EMPTY_FORM = { type: 'account', account: '', username: '', password: '12345678', player_id: '', player_name: '' };

export default function AdminUsers() {
  const { user: currentUser, isOwner } = useAuth();
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState(null);

  const load = async () => {
    try {
      const [userResponse, playerResponse] = await Promise.all([listUsers(), listPlayers()]);
      setUsers(userResponse.data);
      setPlayers(playerResponse.data);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const unboundPlayers = players.filter(player => !player.bound_user_id);

  const handleCreate = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { account: form.account, username: form.username, password: form.password };
      if (form.type === 'existing-player') payload.player_id = Number(form.player_id);
      if (form.type === 'new-player') payload.player_name = form.player_name;
      await createUser(payload);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleToggleRole = async target => {
    const nextRole = target.role === 'admin' ? 'player' : 'admin';
    const action = nextRole === 'admin' ? '任命为管理员' : '撤销管理员权限';
    if (!confirm(`确定将 ${target.username || target.account} ${action}？`)) return;
    try { await updateUserRole(target.id, nextRole); await load(); }
    catch (err) { alert(err.message); }
  };

  const handleBinding = async (target, playerId) => {
    try { await bindUserPlayer(target.id, playerId ? Number(playerId) : null); await load(); }
    catch (err) { alert(err.message); }
  };

  const handleReset = async target => {
    if (!confirm(`确定重置 ${target.username || target.account} 的密码？该用户当前登录会立即失效。`)) return;
    try {
      const response = await resetUserPassword(target.id);
      setTemporaryPassword({ user: target.username || target.account, value: response.data.temporary_password });
      await load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async target => {
    if (!confirm(`确定删除用户 ${target.username || target.account}？其留言板内容和评论也可能被删除，但绑定的队员档案会保留。`)) return;
    try { await deleteUser(target.id); await load(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div><h1 className="text-xl font-bold text-text-main">用户管理</h1><p className="text-sm text-text-sub mt-1">管理员可以新增、绑定和重置用户；只有总负责人可以任命管理员。</p></div>
        <button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }} className="min-h-11 px-3 inline-flex items-center gap-1.5 bg-primary text-white text-sm rounded-xl hover:bg-red-700"><Plus size={16} />新增用户／队员</button>
      </div>

      <div className="bg-white rounded-2xl card-shadow overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead><tr className="border-b text-left text-text-sub text-xs"><th className="p-3 pl-4">用户</th><th className="p-3">账号</th><th className="p-3">绑定队员</th><th className="p-3">角色</th><th className="p-3">密码状态</th><th className="p-3 pr-4">操作</th></tr></thead>
          <tbody>
            {users.map(target => {
              const meta = ROLE_META[target.role] || ROLE_META.player;
              const roleLocked = target.role === 'owner' || target.id === currentUser?.id;
              const deleteLocked = target.role === 'owner' || target.id === currentUser?.id || (!isOwner && target.role === 'admin');
              const resetLocked = target.id === currentUser?.id;
              return (
                <tr key={target.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-3 pl-4"><div className="flex items-center gap-2"><UserAvatar src={target.avatar_url} name={target.username} size="sm" /><span className="font-medium">{target.username || '未设置用户名'}</span>{target.role === 'owner' && <Crown size={14} className="text-amber-500" />}{target.role === 'admin' && <Shield size={14} className="text-primary" />}</div></td>
                  <td className="p-3 text-text-sub">{target.account}</td>
                  <td className="p-3"><select value={target.player_id || ''} onChange={event => handleBinding(target, event.target.value)} className="min-h-10 max-w-[190px] px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"><option value="">未绑定</option>{target.player_id && <option value={target.player_id}>{target.player_name}</option>}{unboundPlayers.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}</select></td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${meta.className}`}>{meta.label}</span></td>
                  <td className="p-3"><span className={`text-xs ${target.must_change_password ? 'text-amber-600' : 'text-green-600'}`}>{target.must_change_password ? '待修改临时密码' : '正常'}</span></td>
                  <td className="p-3 pr-4"><div className="flex items-center gap-1.5">
                    {!resetLocked && <button onClick={() => handleReset(target)} className="min-h-9 px-2 inline-flex items-center gap-1 text-xs bg-blue-50 text-secondary rounded-lg hover:bg-blue-100"><KeyRound size={13} />重置密码</button>}
                    {isOwner && !roleLocked && <button onClick={() => handleToggleRole(target)} className="min-h-9 px-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg">{target.role === 'admin' ? '撤销管理员' : '任命管理员'}</button>}
                    {!deleteLocked && <button onClick={() => handleDelete(target)} className="w-9 h-9 inline-flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" aria-label={`删除${target.username || target.account}`}><Trash2 size={15} /></button>}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full h-[calc(100dvh-1rem)] sm:h-auto sm:max-w-md sm:max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">新增用户／队员</h2><button onClick={() => setShowCreate(false)} className="w-11 h-11 inline-flex items-center justify-center" aria-label="关闭"><X size={18} /></button></div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">创建类型</label><select value={form.type} onChange={event => setForm({ ...EMPTY_FORM, type: event.target.value })} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"><option value="account">普通社区用户</option><option value="existing-player">绑定已有队员</option><option value="new-player">同时新增队员</option></select></div>
              {form.type === 'existing-player' && <div><label className="block text-sm font-medium mb-1.5">选择队员</label><select required value={form.player_id} onChange={event => setForm({ ...form, player_id: event.target.value })} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"><option value="">请选择未绑定队员</option>{unboundPlayers.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}</select></div>}
              {form.type === 'new-player' && <div><label className="block text-sm font-medium mb-1.5">新队员姓名</label><input required value={form.player_name} onChange={event => setForm({ ...form, player_name: event.target.value })} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>}
              <div><label className="block text-sm font-medium mb-1.5">登录账号</label><input required value={form.account} onChange={event => setForm({ ...form, account: event.target.value.toLowerCase() })} pattern="[a-zA-Z0-9_-]{4,32}" className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="4-32位字母、数字、_或-" /></div>
              <div><label className="block text-sm font-medium mb-1.5">公开用户名</label><input value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder={form.type === 'account' ? '可以稍后由用户设置' : '留空时默认使用队员姓名'} /></div>
              <div><label className="block text-sm font-medium mb-1.5">初始密码</label><input value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" /><p className="mt-1.5 text-xs text-text-sub">首次登录必须修改，之后才能使用网站功能。</p></div>
              <button type="submit" disabled={saving} className="w-full min-h-11 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50">{saving ? '创建中...' : '创建'}</button>
            </form>
          </div>
        </div>
      )}

      {temporaryPassword && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5"><h2 className="font-semibold text-text-main">临时密码已生成</h2><p className="mt-2 text-sm text-text-sub">请把下面的密码单独发给 {temporaryPassword.user}。关闭后系统不会再次显示。</p><code className="mt-4 block p-3 bg-gray-100 rounded-xl text-center text-lg font-bold select-all">{temporaryPassword.value}</code><button onClick={() => setTemporaryPassword(null)} className="mt-4 w-full min-h-11 bg-primary text-white text-sm rounded-xl">我已保存，关闭</button></div>
        </div>
      )}
    </div>
  );
}
