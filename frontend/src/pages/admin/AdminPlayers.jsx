import { useState, useEffect } from 'react';
import { listPlayers, createPlayer, updatePlayer, deletePlayer, uploadImage } from '../../api/admin';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';

const EMPTY = { name: '', position: '', jersey_number: '', grade: '', college: '', status: 'active', bio: '', join_year: '', message: '', is_captain: false, is_former_captain: false, photo_url: '' };

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const res = await listPlayers(); setPlayers(res.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (p) => { setForm(p); setEditId(p.id); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null, grade: form.grade ? parseInt(form.grade) : null, join_year: form.join_year ? parseInt(form.join_year) : null, is_captain: !!form.is_captain, is_former_captain: !!form.is_former_captain };
      if (editId) await updatePlayer(editId, data);
      else await createPlayer(data);
      setShowModal(false);
      load();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除该队员？')) return;
    try { await deletePlayer(id); load(); } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold text-text-main">队员管理</h1><p className="text-xs text-text-sub mt-0.5">{players.length} 名队员</p></div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700"><Plus size={16}/>新增队员</button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-text-sub text-xs">
            <th className="p-3 pl-4">姓名</th><th className="p-3">位置</th><th className="p-3">号码</th><th className="p-3">学院</th><th className="p-3">状态</th><th className="p-3 pr-4">操作</th>
          </tr></thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-3 pl-4 font-medium">{p.name}{p.is_captain ? <span className="ml-1.5 text-xs text-amber-600">现任队长</span>:''}{p.is_former_captain ? <span className="ml-1.5 text-xs text-blue-600">历届队长</span>:''}</td>
                <td className="p-3 text-text-sub">{p.position||'-'}</td>
                <td className="p-3 text-text-sub">{p.jersey_number||'-'}</td>
                <td className="p-3"><span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.college||'-'}</span></td>
                <td className="p-3"><span className={`text-xs px-1.5 py-0.5 rounded ${p.status==='active'?'bg-green-50 text-green-600':'bg-gray-100 text-text-sub'}`}>{p.status==='active'?'现役':'离队'}</span></td>
                <td className="p-3 pr-4">
                  <button onClick={()=>openEdit(p)} className="p-1 text-gray-400 hover:text-secondary mr-1"><Edit2 size={15}/></button>
                  <button onClick={()=>handleDelete(p.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={15}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=>setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{editId?'编辑队员':'新增队员'}</h2><button onClick={()=>setShowModal(false)}><X size={18}/></button></div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <ImageUploader
                currentUrl={form.photo_url}
                previewSize="h-32"
                onUpload={async (file) => {
                  const fd = new FormData();
                  fd.append('image', file);
                  const res = await uploadImage(fd);
                  const url = res.data.url;
                  setForm({ ...form, photo_url: url });
                  return url;
                }}
              />
              <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="姓名 *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
              <div className="grid grid-cols-2 gap-2">
                <input className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="位置" value={form.position} onChange={e=>setForm({...form,position:e.target.value})}/>
                <input className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="号码" type="number" value={form.jersey_number} onChange={e=>setForm({...form,jersey_number:e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="入学年份" type="number" value={form.grade} onChange={e=>setForm({...form,grade:e.target.value})}/>
                <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.college} onChange={e=>setForm({...form,college:e.target.value})}>
                  <option value="">学院</option>
                  {['政管','国关','中文','统计'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  <option value="active">现役</option><option value="alumni">离队</option>
                </select>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.is_captain} onChange={e=>setForm({...form,is_captain:e.target.checked})}/>现任队长</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.is_former_captain} onChange={e=>setForm({...form,is_former_captain:e.target.checked})}/>历届队长</label>
              </div>
              <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="入队年份（如 2023）" type="number" value={form.join_year} onChange={e=>setForm({...form,join_year:e.target.value})}/>
              <textarea className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={2} placeholder="简介" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/>
              <textarea className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={2} placeholder="寄语" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
