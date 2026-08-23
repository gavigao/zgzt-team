import { useState, useEffect } from 'react';
import { updateTeamInfo } from '../../api/admin';
import { getTeamInfo } from '../../api/public';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminSettings() {
  const [intro, setIntro] = useState({ title: '', content: '' });
  const [milestones, setMilestones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getTeamInfo('introduction').then(r => { if(r.data) setIntro({title:r.data.title||'', content:r.data.content||''}); }).catch(()=>{});
    getTeamInfo('milestones').then(r => {
      if (r.data && r.data.content) {
        try { setMilestones(JSON.parse(r.data.content)); } catch { setMilestones([]); }
      }
    }).catch(()=>{});
  }, []);

  const saveIntro = async (e) => { e.preventDefault(); setSaving(true); setMsg('');
    try { await updateTeamInfo('introduction', intro); setMsg('✅ 球队介绍已保存'); } catch(err){alert(err.message);} finally {setSaving(false);} };

  const updateMilestone = (i, field, value) => {
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };
  const addMilestone = () => setMilestones(prev => [...prev, { year: '', title: '', desc: '' }]);
  const removeMilestone = (i) => setMilestones(prev => prev.filter((_, idx) => idx !== i));
  const saveMilestones = async () => {
    setSaving(true); setMsg('');
    try {
      await updateTeamInfo('milestones', { title: '', content: JSON.stringify(milestones) });
      setMsg('✅ 大事记已保存');
    } catch(err){ alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-text-main mb-1">网站设置</h1>
      <p className="text-sm text-text-sub mb-6">编辑球队介绍与大事记</p>
      {msg && <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-xl mb-4">{msg}</div>}

      <div className="space-y-6">
        {/* 球队介绍 */}
        <form onSubmit={saveIntro} className="bg-white rounded-2xl card-shadow p-5">
          <h2 className="font-semibold text-text-main mb-3">球队介绍</h2>
          <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm mb-2" placeholder="标题" value={intro.title} onChange={e=>setIntro({...intro,title:e.target.value})}/>
          <textarea className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" rows={5} placeholder="介绍内容（支持 Markdown）" value={intro.content} onChange={e=>setIntro({...intro,content:e.target.value})}/>
          <button type="submit" disabled={saving} className="mt-2 px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存介绍'}</button>
        </form>

        {/* 大事记 */}
        <div className="bg-white rounded-2xl card-shadow p-5">
          <h2 className="font-semibold text-text-main mb-1">大事记</h2>
          <p className="text-xs text-text-sub mb-3">展示在球队历史页的时间线</p>
          {milestones.map((m, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3 mb-2 space-y-2">
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="年份" value={m.year} onChange={e=>updateMilestone(i, 'year', e.target.value)}/>
                <input className="flex-1 px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="标题" value={m.title} onChange={e=>updateMilestone(i, 'title', e.target.value)}/>
                <button onClick={()=>removeMilestone(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="描述" value={m.desc} onChange={e=>updateMilestone(i, 'desc', e.target.value)}/>
            </div>
          ))}
          <button onClick={addMilestone} className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-sm text-text-sub hover:bg-gray-50 flex items-center justify-center gap-1"><Plus size={15}/>添加条目</button>
          <button onClick={saveMilestones} disabled={saving} className="mt-3 w-full py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存大事记'}</button>
        </div>
      </div>
    </div>
  );
}
