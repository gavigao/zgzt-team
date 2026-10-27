import { useState, useEffect, useRef } from 'react';
import { listMatches, createMatch, updateMatch, deleteMatch, createSeason } from '../../api/admin';
import { getSeasons } from '../../api/public';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const EMPTY = { opponent: '', match_date: '', our_score: '', opponent_score: '', summary: '', season_id: '', competition: '', stage: '' };

function validateSeasonName(value) {
  const normalized = value.trim().replace(/[–—]/g, '-').replace(/\s*-\s*/g, '-');
  const years = /^(\d{4})-(\d{4})$/.exec(normalized);
  return years && Number(years[1]) >= 1000 && Number(years[2]) === Number(years[1]) + 1
    ? '' : '请填写连续两个完整年份，例如 2026-2027';
}

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [addingSeason, setAddingSeason] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [seasonError, setSeasonError] = useState('');
  const [seasonMessage, setSeasonMessage] = useState('');
  const [creatingSeason, setCreatingSeason] = useState(false);
  const seasonNameRef = useRef(null);
  const seasonSelectRef = useRef(null);
  const addSeasonButtonRef = useRef(null);
  const dialogRef = useRef(null);

  const load = async () => {
    setLoadError('');
    try {
      const [m, s] = await Promise.all([listMatches(), getSeasons()]);
      setMatches(m.data);
      setSeasons(s.data);
    } catch (err) {
      setLoadError(err.message || '比赛或赛季加载失败，请重试');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (addingSeason) seasonNameRef.current?.focus();
  }, [addingSeason]);

  useEffect(() => {
    if (seasonError) seasonNameRef.current?.focus();
  }, [seasonError]);

  useEffect(() => {
    if (seasonMessage) seasonSelectRef.current?.focus();
  }, [seasonMessage]);

  useEffect(() => {
    if (!show) return undefined;
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector('input')?.focus();
    return () => previousFocus?.focus();
  }, [show]);

  const resetSeasonEditor = () => { setAddingSeason(false); setSeasonError(''); setSeasonMessage(''); };
  const openNew = () => { setForm(EMPTY); setEditId(null); resetSeasonEditor(); setShow(true); };
  const openEdit = (m) => { setForm(m); setEditId(m.id); resetSeasonEditor(); setShow(true); };
  const closeDialog = () => { if (!saving && !creatingSeason) setShow(false); };

  const openSeasonEditor = () => {
    const starts = seasons.map(season => Number(/^(\d{4})-\d{4}$/.exec(season.name)?.[1])).filter(Number.isFinite);
    const nextYear = Math.min(9998, Math.max(new Date().getFullYear() - 1, ...starts) + 1);
    setSeasonName(`${nextYear}-${nextYear + 1}`);
    setSeasonError('');
    setSeasonMessage('');
    setAddingSeason(true);
  };

  const cancelSeasonEditor = () => {
    if (creatingSeason) return;
    setAddingSeason(false);
    setSeasonError('');
    addSeasonButtonRef.current?.focus();
  };

  const handleCreateSeason = async () => {
    if (creatingSeason) return;
    const validationError = validateSeasonName(seasonName);
    if (validationError) {
      setSeasonError(validationError);
      seasonNameRef.current?.focus();
      return;
    }
    setCreatingSeason(true);
    setSeasonError('');
    try {
      const res = await createSeason({ name: seasonName.trim() });
      const season = res.data;
      setSeasons(current => [...current.filter(item => item.id !== season.id), season].sort((a, b) => b.name.localeCompare(a.name)));
      setForm(current => ({ ...current, season_id: String(season.id) }));
      setAddingSeason(false);
      setSeasonMessage(`已新增 ${season.name} 赛季，并自动选中。`);
      seasonSelectRef.current?.focus();
    } catch (err) {
      setSeasonError(err.message || '新增赛季失败，请重试');
      seasonNameRef.current?.focus();
      getSeasons().then(response => setSeasons(response.data)).catch(() => {});
    } finally { setCreatingSeason(false); }
  };

  const handleDialogKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (addingSeason) cancelSeasonEditor(); else closeDialog();
    }
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (creatingSeason || addingSeason) return;
    setSaving(true);
    try {
      const data = { ...form, our_score: form.our_score!==''?parseInt(form.our_score):null, opponent_score: form.opponent_score!==''?parseInt(form.opponent_score):null, season_id: form.season_id||null, competition: form.competition||null, stage: form.stage||null };
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
      {loadError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex flex-wrap items-center gap-2">{loadError}<button type="button" onClick={load} className="min-h-11 px-3 underline">重新加载</button></div>}
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
              <td className="p-3 pr-4"><button onClick={()=>openEdit(m)} aria-label={`编辑与${m.opponent}的比赛`} className="p-1 text-gray-400 hover:text-secondary mr-1"><Edit2 size={15}/></button><button onClick={()=>handleDelete(m.id)} aria-label={`删除与${m.opponent}的比赛`} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={15}/></button></td>
            </tr>))}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="match-dialog-title" onKeyDown={handleDialogKeyDown} className="bg-white rounded-t-2xl sm:rounded-2xl w-full h-[calc(100dvh-1rem)] sm:h-auto sm:max-w-md sm:max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b"><h2 id="match-dialog-title" className="font-semibold">{editId?'编辑比赛':'新增比赛'}</h2><button type="button" onClick={closeDialog} disabled={saving || creatingSeason} aria-label="关闭比赛编辑" className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"><X size={18}/></button></div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <input className="w-full min-w-0 min-h-11 px-3 py-2 bg-gray-50 border rounded-xl text-base sm:text-sm" aria-label="对手" placeholder="对手 *" value={form.opponent} onChange={e=>setForm({...form,opponent:e.target.value})} required/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="match-season" className="text-sm font-medium text-text-main">赛季</label>
                    <button ref={addSeasonButtonRef} type="button" onClick={openSeasonEditor} disabled={creatingSeason || saving || addingSeason} className="min-h-11 px-1 inline-flex items-center gap-1 text-sm font-medium text-secondary rounded-lg focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-50"><Plus size={14} aria-hidden="true"/>新增赛季</button>
                  </div>
                  <select ref={seasonSelectRef} id="match-season" className="w-full min-w-0 min-h-11 px-3 py-2 bg-gray-50 border rounded-xl text-base sm:text-sm" disabled={creatingSeason} value={form.season_id ?? ''} onChange={e=>setForm({...form,season_id:e.target.value})}><option value="">选择赛季</option>{seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                </div>
                <div className="min-w-0">
                  <label htmlFor="match-competition" className="block text-sm font-medium text-text-main mb-2">赛事类型</label>
                  <select id="match-competition" className="w-full min-w-0 min-h-11 px-3 py-2 bg-gray-50 border rounded-xl text-base sm:text-sm" value={form.competition ?? ''} onChange={e=>setForm({...form,competition:e.target.value})}>
                  <option value="">赛事类型</option><option value="新生赛">新生赛</option><option value="联赛">联赛</option>
                  </select>
                </div>
              </div>
              {addingSeason && <fieldset disabled={creatingSeason} className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-2">
                <legend className="px-1 text-sm font-semibold text-secondary">新增赛季</legend>
                <label htmlFor="new-season-name" className="block text-sm font-medium text-text-main">赛季名称</label>
                <input ref={seasonNameRef} id="new-season-name" type="text" maxLength={20} value={seasonName} onChange={e => setSeasonName(e.target.value)} onBlur={() => { if (!creatingSeason) setSeasonError(validateSeasonName(seasonName)); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateSeason(); } }} aria-invalid={Boolean(seasonError)} aria-describedby={`season-name-help${seasonError ? ' season-name-error' : ''}`} className="w-full min-w-0 min-h-11 px-3 py-2 bg-white border rounded-xl text-base sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary" placeholder="例如：2026-2027"/>
                <p id="season-name-help" className="text-xs leading-5 text-text-sub">填写连续两个完整年份，例如 2026-2027；创建后自动选中，不影响已录入的比赛。</p>
                {seasonError && <p id="season-name-error" role="alert" className="text-sm text-red-700">{seasonError}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleCreateSeason} disabled={creatingSeason} className="min-h-11 px-3 py-2 bg-secondary text-white text-sm font-medium rounded-xl disabled:opacity-50">{creatingSeason ? '创建中…' : '创建并选中'}</button>
                  <button type="button" onClick={cancelSeasonEditor} disabled={creatingSeason} className="min-h-11 px-3 py-2 bg-white border text-sm rounded-xl disabled:opacity-50">取消新增</button>
                </div>
              </fieldset>}
              {seasonMessage && <p role="status" className="text-sm text-green-700">{seasonMessage}</p>}
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full min-w-0 min-h-11 px-3 py-2 bg-gray-50 border rounded-xl text-base sm:text-sm" aria-label="比赛阶段" placeholder="阶段，如：小组赛第一轮" value={form.stage ?? ''} onChange={e=>setForm({...form,stage:e.target.value})}/>
                <input className="w-full min-w-0 min-h-11 px-3 py-2 bg-gray-50 border rounded-xl text-base sm:text-sm" aria-label="比赛日期" type="date" value={form.match_date} onChange={e=>setForm({...form,match_date:e.target.value})} required/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full min-w-0 min-h-11 px-3 py-2 bg-gray-50 border rounded-xl text-base sm:text-sm" type="number" placeholder="我方得分" value={form.our_score ?? ''} onChange={e=>setForm({...form,our_score:e.target.value})}/>
                <input className="w-full min-w-0 min-h-11 px-3 py-2 bg-gray-50 border rounded-xl text-base sm:text-sm" type="number" placeholder="对方得分" value={form.opponent_score ?? ''} onChange={e=>setForm({...form,opponent_score:e.target.value})}/>
              </div>
              <p className="text-xs text-text-sub">录入未来赛程时，双方得分都留空；比赛结束后再回来补比分和总结。</p>
              <textarea className="w-full min-w-0 px-3 py-2 bg-gray-50 border rounded-xl text-base sm:text-sm" rows={3} placeholder="赛后总结（支持 Markdown）" value={form.summary ?? ''} onChange={e=>setForm({...form,summary:e.target.value})}/>
              <button type="submit" disabled={saving || creatingSeason || addingSeason} className="w-full min-h-11 py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
