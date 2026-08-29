import { useState, useEffect } from 'react';
import { listTraining, createTraining, updateTraining, deleteTraining } from '../../api/admin';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const EMPTY = { title: '', description: '', schedule_date: '', start_time: '', end_time: '', location: '', status: 'upcoming' };

export default function AdminTraining() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => { try { setItems((await listTraining()).data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setShow(true); };
  const openEdit = (t) => { setForm(t); setEditId(t.id); setShow(true); };

  const handleSave = async (e) => {
    e.preventDefault(); if(!form.title||!form.schedule_date) return alert('标题和日期不能为空'); setSaving(true);
    try { if(editId) await updateTraining(editId, form); else await createTraining(form); setShow(false); load(); } catch(err){alert(err.message);} finally {setSaving(false);}
  };

  const handleDelete = async (id) => { if(!confirm('确定删除？'))return; try{await deleteTraining(id);load();}catch(err){alert(err.message);} };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold text-text-main">训练管理</h1></div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700"><Plus size={16}/>新增训练</button>
      </div>
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-text-sub text-xs"><th className="p-3 pl-4">标题</th><th className="p-3">日期</th><th className="p-3">时间</th><th className="p-3">状态</th><th className="p-3 pr-4">操作</th></tr></thead>
          <tbody>{items.map(t=>(<tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50"><td className="p-3 pl-4 font-medium">{t.title}</td><td className="p-3">{t.schedule_date}</td><td className="p-3 text-text-sub">{t.start_time||'-'}{t.end_time?' - '+t.end_time:''}</td><td className="p-3"><span className={`text-xs px-1.5 py-0.5 rounded ${t.status==='upcoming'?'bg-green-50 text-green-600':t.status==='completed'?'bg-gray-100 text-text-sub':'bg-red-50 text-red-500'}`}>{t.status==='upcoming'?'即将':t.status==='completed'?'完成':'取消'}</span></td><td className="p-3 pr-4"><button onClick={()=>openEdit(t)} className="p-1 text-gray-400 hover:text-secondary mr-1"><Edit2 size={15}/></button><button onClick={()=>handleDelete(t.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={15}/></button></td></tr>))}</tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full h-[calc(100dvh-1rem)] sm:h-auto sm:max-w-md sm:max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{editId?'编辑训练':'新增训练'}</h2><button onClick={()=>setShow(false)}><X size={18}/></button></div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="标题 *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" type="date" value={form.schedule_date} onChange={e=>setForm({...form,schedule_date:e.target.value})} required/>
              <div className="grid grid-cols-2 gap-2">
                <input className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/>
                <input className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/>
              </div>
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="地点" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
              <select className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="upcoming">即将进行</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select>
              <textarea className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" rows={2} placeholder="描述" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
