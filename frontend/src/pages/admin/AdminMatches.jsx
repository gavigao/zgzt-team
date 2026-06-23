import { useState, useEffect } from 'react';
import { listMatches, createMatch, updateMatch, deleteMatch } from '../../api/admin';
import { getSeasons } from '../../api/public';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const EMPTY = { opponent: '', match_date: '', location: '', home_away: 'home', our_score: '', opponent_score: '', summary: '', season_id: '', competition: '', stage: '', is_highlighted: false };

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const [m,s] = await Promise.all([listMatches(), getSeasons()]); setMatches(m.data); setSeasons(s.data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditId(null); setShow(true); };
  const openEdit = (m) => { setForm(m); setEditId(m.id); setShow(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = { ...form, our_score: form.our_score!==''?parseInt(form.our_score):null, opponent_score: form.opponent_score!==''?parseInt(form.opponent_score):null, season_id: form.season_id||null, competition: form.competition||null, stage: form.stage||null, is_highlighted:!!form.is_highlighted };
      if (editId) await updateMatch(editId, data); else await createMatch(data);
      setShow(false); load();
    } catch(err) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => { if(!confirm('确定删除？'))return; try{await deleteMatch(id);load();}catch(err){alert(err.message);} };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold text-text-main">比赛管理</h1><p className="text-xs text-text-sub mt-0.5">{matches.length} 场比赛</p></div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700"><Plus size={16}/>新增比赛</button>
      </div>
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 text-left text-text-sub text-xs">
            <th className="p-3 pl-4">日期</th><th className="p-3">赛事</th><th className="p-3">对手</th><th className="p-3">比分</th><th className="p-3 pr-4">操作</th>
          </tr></thead>
          <tbody>
            {matches.map(m=>(<tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="p-3 pl-4">{m.match_date}</td>
              <td className="p-3 text-xs">{m.competition ? `${m.competition}${m.stage?'·'+m.stage:''}` : '-'}</td>
              <td className="p-3 font-medium">{m.opponent}</td><td className="p-3 tabular-nums">{m.our_score??'-'}:{m.opponent_score??'-'}</td>
              <td className="p-3 pr-4"><button onClick={()=>openEdit(m)} className="p-1 text-gray-400 hover:text-secondary mr-1"><Edit2 size={15}/></button><button onClick={()=>handleDelete(m.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={15}/></button></td>
            </tr>))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=>setShow(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{editId?'编辑比赛':'新增比赛'}</h2><button onClick={()=>setShow(false)}><X size={18}/></button></div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="对手 *" value={form.opponent} onChange={e=>setForm({...form,opponent:e.target.value})} required/>
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" type="date" value={form.match_date} onChange={e=>setForm({...form,match_date:e.target.value})} required/>
              <div className="grid grid-cols-2 gap-2">
                <select className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" value={form.home_away} onChange={e=>setForm({...form,home_away:e.target.value})}><option value="home">主场</option><option value="away">客场</option></select>
                <select className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" value={form.season_id} onChange={e=>setForm({...form,season_id:e.target.value})}><option value="">选择赛季</option>{seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" value={form.competition} onChange={e=>setForm({...form,competition:e.target.value})}>
                  <option value="">赛事类型</option><option value="新生赛">新生赛</option><option value="联赛">联赛</option>
                </select>
                <input className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="阶段，如：小组赛第一轮" value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" type="number" placeholder="我方得分" value={form.our_score} onChange={e=>setForm({...form,our_score:e.target.value})}/>
                <input className="px-3 py-2 bg-gray-50 border rounded-xl text-sm" type="number" placeholder="对方得分" value={form.opponent_score} onChange={e=>setForm({...form,opponent_score:e.target.value})}/>
              </div>
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="地点" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
              <textarea className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" rows={3} placeholder="赛后总结（支持 Markdown）" value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.is_highlighted} onChange={e=>setForm({...form,is_highlighted:e.target.checked})}/>焦点战</label>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
