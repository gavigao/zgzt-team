import { useEffect, useRef, useState } from 'react';
import { Camera, ExternalLink, Save, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMyPlayerProfile, updateMyPlayerPhoto, updateMyPlayerProfile } from '../../api/playerProfile';

const EMPTY = {
  position: '', jersey_number: '', grade: '', college: '', status: 'active',
  bio: '', bio_visible: true, workplace: '', workplace_visible: false,
  city: '', city_visible: false, join_year: '', message: '',
};

function VisibilityToggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-text-sub cursor-pointer">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="accent-primary" />
      {label}
    </label>
  );
}

export default function MyPlayerProfile() {
  const [player, setPlayer] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await getMyPlayerProfile();
      setPlayer(response.data);
      setForm({ ...EMPTY, ...response.data });
      setError('');
    } catch (err) {
      setError(err.message || '队员资料加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const handleSave = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await updateMyPlayerProfile({
        ...form,
        jersey_number: form.jersey_number === '' ? null : Number(form.jersey_number),
        grade: form.grade === '' ? null : Number(form.grade),
        join_year: form.join_year === '' ? null : Number(form.join_year),
      });
      setPlayer(response.data);
      setForm({ ...EMPTY, ...response.data });
      setMessage('队员主页已更新');
    } catch (err) {
      setError(err.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await updateMyPlayerPhoto(formData);
      setPlayer(response.data);
      setForm(current => ({ ...current, photo_url: response.data.photo_url }));
      setMessage('队员照片已更新');
    } catch (err) {
      setError(err.message || '照片上传失败，请重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <div className="space-y-3"><div className="skeleton h-28 rounded-2xl" /><div className="skeleton h-80 rounded-2xl" /></div>;
  if (!player) return <div className="bg-white rounded-2xl card-shadow p-8 text-center text-sm text-text-sub">{error || '当前账号尚未绑定队员档案'}</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-main">我的队员资料</h1>
          <p className="text-sm text-text-sub mt-1">这里的照片和资料会展示在前台队员名录中，与社区头像相互独立。</p>
        </div>
        <Link to={`/players/${player.id}`} className="min-h-11 px-3 inline-flex items-center gap-1.5 text-sm text-secondary hover:bg-blue-50 rounded-xl">
          查看公开主页 <ExternalLink size={15} aria-hidden="true" />
        </Link>
      </div>

      {error && <div role="alert" className="mb-4 bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-xl">{error}</div>}
      {message && <div role="status" className="mb-4 bg-green-50 text-green-700 text-sm px-3 py-2.5 rounded-xl">{message}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        <section className="bg-white rounded-2xl card-shadow p-5 sm:p-6">
          <h2 className="font-semibold text-text-main mb-4">队员照片</h2>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
              {player.photo_url ? <img src={player.photo_url} alt={`${player.name}的队员照片`} className="w-full h-full object-cover" /> : <UserRound size={38} className="text-gray-300" />}
            </div>
            <div>
              <label className="min-h-11 px-4 inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium cursor-pointer">
                <Camera size={17} aria-hidden="true" /> {uploading ? '上传中...' : '更换队员照片'}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePhoto} disabled={uploading} className="hidden" />
              </label>
              <p className="mt-2 text-xs text-text-sub">用于队员名录，支持 JPG、PNG、GIF、WebP，最大 5 MB。</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl card-shadow p-5 sm:p-6">
          <h2 className="font-semibold text-text-main mb-4">基本资料</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">姓名</label><input value={player.name} readOnly className="w-full min-h-11 px-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500" /></div>
            <div><label htmlFor="player-position" className="block text-sm font-medium mb-1.5">位置</label><input id="player-position" value={form.position || ''} onChange={event => updateField('position', event.target.value)} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="例如：中场" /></div>
            <div><label htmlFor="player-number" className="block text-sm font-medium mb-1.5">球衣号码</label><input id="player-number" type="number" min="0" max="999" value={form.jersey_number ?? ''} onChange={event => updateField('jersey_number', event.target.value)} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
            <div><label htmlFor="player-college" className="block text-sm font-medium mb-1.5">学院</label><select id="player-college" value={form.college || ''} onChange={event => updateField('college', event.target.value)} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"><option value="">暂未填写</option>{['政管','国关','文传','统计'].map(item => <option key={item}>{item}</option>)}</select></div>
            <div><label htmlFor="player-grade" className="block text-sm font-medium mb-1.5">入学年份</label><input id="player-grade" type="number" value={form.grade ?? ''} onChange={event => updateField('grade', event.target.value)} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
            <div><label htmlFor="player-join-year" className="block text-sm font-medium mb-1.5">入队年份</label><input id="player-join-year" type="number" value={form.join_year ?? ''} onChange={event => updateField('join_year', event.target.value)} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
            <div><label htmlFor="player-status" className="block text-sm font-medium mb-1.5">状态</label><select id="player-status" value={form.status || 'active'} onChange={event => updateField('status', event.target.value)} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"><option value="active">现役</option><option value="alumni">离队／校友</option></select></div>
          </div>
        </section>

        <section className="bg-white rounded-2xl card-shadow p-5 sm:p-6 space-y-4">
          <div><h2 className="font-semibold text-text-main">毕业去向与近况</h2><p className="text-xs text-text-sub mt-1">以下信息都是可选项；只有打开“公开展示”后，其他人才会在你的队员主页看到。</p></div>
          <div><div className="flex items-center justify-between gap-3 mb-1.5"><label htmlFor="player-workplace" className="text-sm font-medium">工作单位／毕业去向</label><VisibilityToggle checked={!!form.workplace_visible} onChange={value => updateField('workplace_visible', value)} label="公开展示" /></div><input id="player-workplace" value={form.workplace || ''} onChange={event => updateField('workplace', event.target.value)} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
          <div><div className="flex items-center justify-between gap-3 mb-1.5"><label htmlFor="player-city" className="text-sm font-medium">所在城市</label><VisibilityToggle checked={!!form.city_visible} onChange={value => updateField('city_visible', value)} label="公开展示" /></div><input id="player-city" value={form.city || ''} onChange={event => updateField('city', event.target.value)} className="w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div>
          <div><div className="flex items-center justify-between gap-3 mb-1.5"><label htmlFor="player-bio" className="text-sm font-medium">个人简介</label><VisibilityToggle checked={!!form.bio_visible} onChange={value => updateField('bio_visible', value)} label="公开展示" /></div><textarea id="player-bio" rows="4" value={form.bio || ''} onChange={event => updateField('bio', event.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-y" /></div>
          <div><label htmlFor="player-message" className="block text-sm font-medium mb-1.5">寄语</label><textarea id="player-message" rows="3" value={form.message || ''} onChange={event => updateField('message', event.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-y" /></div>
        </section>

        <button type="submit" disabled={saving} className="w-full sm:w-auto min-h-11 px-6 inline-flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <Save size={17} aria-hidden="true" /> {saving ? '保存中...' : '保存队员资料'}
        </button>
      </form>
    </div>
  );
}
