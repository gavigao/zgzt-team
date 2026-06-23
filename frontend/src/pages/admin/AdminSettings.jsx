import { useState, useEffect } from 'react';
import { updateTeamInfo } from '../../api/admin';
import { getTeamInfo } from '../../api/public';

export default function AdminSettings() {
  const [history, setHistory] = useState({ title: '', content: '' });
  const [intro, setIntro] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getTeamInfo('history').then(r => { if(r.data) setHistory({title:r.data.title||'', content:r.data.content||''}); }).catch(()=>{});
    getTeamInfo('introduction').then(r => { if(r.data) setIntro({title:r.data.title||'', content:r.data.content||''}); }).catch(()=>{});
  }, []);

  const saveHistory = async (e) => { e.preventDefault(); setSaving(true); setMsg('');
    try { await updateTeamInfo('history', history); setMsg('✅ 球队历史已保存'); } catch(err){alert(err.message);} finally {setSaving(false);} };
  const saveIntro = async (e) => { e.preventDefault(); setSaving(true); setMsg('');
    try { await updateTeamInfo('introduction', intro); setMsg('✅ 球队介绍已保存'); } catch(err){alert(err.message);} finally {setSaving(false);} };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-text-main mb-1">网站设置</h1>
      <p className="text-sm text-text-sub mb-6">编辑球队历史与介绍</p>
      {msg && <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-xl mb-4">{msg}</div>}

      <div className="space-y-6">
        {/* 球队介绍 */}
        <form onSubmit={saveIntro} className="bg-white rounded-2xl card-shadow p-5">
          <h2 className="font-semibold text-text-main mb-3">球队介绍</h2>
          <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm mb-2" placeholder="标题" value={intro.title} onChange={e=>setIntro({...intro,title:e.target.value})}/>
          <textarea className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" rows={5} placeholder="介绍内容（支持 Markdown）" value={intro.content} onChange={e=>setIntro({...intro,content:e.target.value})}/>
          <button type="submit" disabled={saving} className="mt-2 px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存介绍'}</button>
        </form>

        {/* 球队历史 */}
        <form onSubmit={saveHistory} className="bg-white rounded-2xl card-shadow p-5">
          <h2 className="font-semibold text-text-main mb-3">球队历史</h2>
          <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm mb-2" placeholder="标题" value={history.title} onChange={e=>setHistory({...history,title:e.target.value})}/>
          <textarea className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" rows={8} placeholder="历史内容（支持 Markdown）" value={history.content} onChange={e=>setHistory({...history,content:e.target.value})}/>
          <button type="submit" disabled={saving} className="mt-2 px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存历史'}</button>
        </form>
      </div>
    </div>
  );
}
