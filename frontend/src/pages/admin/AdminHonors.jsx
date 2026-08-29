import { useState, useEffect } from 'react';
import { listHonors, createHonor, updateHonor, deleteHonor } from '../../api/admin';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const EMPTY = { title: '', description: '', honor_date: '', type: 'team', recipient: '', image_url: '' };

export default function AdminHonors() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => { try { setItems((await listHonors()).data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setShow(true); };
  const openEdit = (h) => { setForm(h); setEditId(h.id); setShow(true); };

  const handleSave = async (e) => {
    e.preventDefault(); if(!form.title) return alert('荣誉名称不能为空'); setSaving(true);
    try { if(editId) await updateHonor(editId, form); else await createHonor(form); setShow(false); load(); } catch(err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => { if(!confirm('确定删除？'))return; try{await deleteHonor(id);load();}catch(err){alert(err.message);} };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold text-text-main">荣誉管理</h1></div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700"><Plus size={16}/>新增荣誉</button>
      </div>
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-text-sub text-xs"><th className="p-3 pl-4">名称</th><th className="p-3">类型</th><th className="p-3">日期</th><th className="p-3 pr-4">操作</th></tr></thead>
          <tbody>{items.map(h=>(<tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50/50"><td className="p-3 pl-4 font-medium">{h.title}{h.recipient?<span className="text-xs text-text-sub ml-1">-{h.recipient}</span>:''}</td><td className="p-3"><span className={`text-xs px-1.5 py-0.5 rounded ${h.type==='team'?'bg-amber-50 text-amber-600':'bg-blue-50 text-blue-600'}`}>{h.type==='team'?'团队':'个人'}</span></td><td className="p-3 text-text-sub">{h.honor_date||'-'}</td><td className="p-3 pr-4"><button onClick={()=>openEdit(h)} className="p-1 text-gray-400 hover:text-secondary mr-1"><Edit2 size={15}/></button><button onClick={()=>handleDelete(h.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={15}/></button></td></tr>))}</tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full h-[calc(100dvh-1rem)] sm:h-auto sm:max-w-md sm:max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{editId?'编辑荣誉':'新增荣誉'}</h2><button onClick={()=>setShow(false)}><X size={18}/></button></div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="名称 *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
              <div className="grid grid-cols-2 gap-2">
                <select className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="team">团队荣誉</option><option value="individual">个人荣誉</option></select>
                <input className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" type="date" value={form.honor_date} onChange={e=>setForm({...form,honor_date:e.target.value})}/>
              </div>
              {form.type==='individual' && <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="获得者" value={form.recipient} onChange={e=>setForm({...form,recipient:e.target.value})}/>}
              <textarea className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" rows={2} placeholder="描述" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
