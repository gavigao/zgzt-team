import { useState, useEffect } from 'react';
import { listNews, createNews, updateNews, deleteNews } from '../../api/admin';
import { Plus, Edit2, Trash2, X, Eye, FileEdit } from 'lucide-react';

const EMPTY = { title: '', content: '', summary: '', cover_image: '', is_pinned: false, status: 'draft' };

export default function AdminNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => { try { setNews((await listNews()).data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setShow(true); };
  const openEdit = (n) => { setForm(n); setEditId(n.id); setShow(true); };

  const handleSave = async (e) => {
    e.preventDefault(); if (!form.title) return alert('标题不能为空'); setSaving(true);
    try {
      const data = { ...form, is_pinned: !!form.is_pinned };
      if (editId) await updateNews(editId, data); else await createNews(data);
      setShow(false); load();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => { if (!confirm('确定删除？')) return; try { await deleteNews(id); load(); } catch (err) { alert(err.message); } };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold text-text-main">新闻管理</h1><p className="text-xs text-text-sub mt-0.5">{news.length} 篇</p></div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700"><Plus size={16}/>新建新闻</button>
      </div>
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-text-sub text-xs">
            <th className="p-3 pl-4">标题</th><th className="p-3">状态</th><th className="p-3">发布日期</th><th className="p-3 pr-4">操作</th>
          </tr></thead>
          <tbody>
            {news.map(n => (
              <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-3 pl-4 font-medium">{n.is_pinned?<span className="text-xs text-primary mr-1">[置顶]</span>:''}{n.title}</td>
                <td className="p-3"><span className={`text-xs px-1.5 py-0.5 rounded ${n.status==='published'?'bg-green-50 text-green-600':'bg-gray-100 text-text-sub'}`}>{n.status==='published'?'已发布':'草稿'}</span></td>
                <td className="p-3 text-text-sub text-xs">{n.published_at?.substring(0,10)||'-'}</td>
                <td className="p-3 pr-4">
                  <button onClick={()=>openEdit(n)} className="p-1 text-gray-400 hover:text-secondary mr-1"><Edit2 size={15}/></button>
                  <button onClick={()=>handleDelete(n.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={15}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=>setShow(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{editId?'编辑新闻':'新建新闻'}</h2><button onClick={()=>setShow(false)}><X size={18}/></button></div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="标题 *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="摘要" value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/>
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="封面图 URL" value={form.cover_image} onChange={e=>setForm({...form,cover_image:e.target.value})}/>
              <textarea className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" rows={5} placeholder="正文内容（支持 Markdown）" value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.is_pinned} onChange={e=>setForm({...form,is_pinned:e.target.checked})}/>置顶</label>
                <select className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  <option value="draft">草稿</option><option value="published">发布</option>
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
