import { useState, useEffect } from 'react';
import { listAlbums, createAlbum, updateAlbum, deleteAlbum, uploadPhoto, deletePhoto, movePhoto } from '../../api/admin';
import { getAlbumPhotos } from '../../api/public';
import { Plus, Edit2, Trash2, X, Upload, ArrowRight } from 'lucide-react';

export default function AdminPhotos() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showA, setShowA] = useState(false); // album modal
  const [showP, setShowP] = useState(false); // photo upload modal
  const [form, setForm] = useState({ title: '', description: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [moveTarget, setMoveTarget] = useState(null);
  const [moveAlbumId, setMoveAlbumId] = useState('');

  const loadAlbums = async () => { try { setAlbums((await listAlbums()).data); } catch {} finally { setLoading(false); } };
  useEffect(() => { loadAlbums(); }, []);

  const openNewAlbum = () => { setForm({ title: '', description: '' }); setEditId(null); setShowA(true); };
  const openEditAlbum = (a) => { setForm(a); setEditId(a.id); setShowA(true); };

  const handleSaveAlbum = async (e) => {
    e.preventDefault(); if(!form.title) return alert('名称不能为空'); setSaving(true);
    try { if(editId) await updateAlbum(editId, form); else await createAlbum(form); setShowA(false); loadAlbums(); } catch(err){alert(err.message);} finally {setSaving(false);}
  };

  const handleDeleteAlbum = async (id) => { if(!confirm('删除相册会同时删除所有照片'))return; try{await deleteAlbum(id);loadAlbums();}catch(err){alert(err.message);} };

  const openPhotos = async (album) => {
    setCurrentAlbum(album); setCaption('');
    try { setPhotos((await getAlbumPhotos(album.id)).data); } catch { setPhotos([]); }
    setShowP(true);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return alert('请选择图片');
    setUploading(true);
    const total = uploadFiles.length;
    setUploadProgress({ done: 0, total });
    try {
      for (let i = 0; i < total; i++) {
        const fd = new FormData();
        fd.append('image', uploadFiles[i]);
        if (caption) fd.append('caption', caption);
        await uploadPhoto(currentAlbum.id, fd);
        setUploadProgress({ done: i + 1, total });
      }
      const res = await getAlbumPhotos(currentAlbum.id);
      setPhotos(res.data);
      setUploadFiles([]); setCaption('');
      alert(`成功上传 ${total} 张照片`);
    } catch (err) {
      alert(`上传失败：${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!confirm('删除照片？')) return;
    try { await deletePhoto(id); setPhotos(p => p.filter(ph => ph.id !== id)); } catch (err) { alert(err.message); }
  };

  const handleMove = async () => {
    if (!moveTarget || !moveAlbumId) return alert('请选择目标相册');
    try {
      await movePhoto(moveTarget.id, moveAlbumId);
      setPhotos(p => p.filter(ph => ph.id !== moveTarget.id));
      setMoveTarget(null); setMoveAlbumId('');
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold text-text-main">照片管理</h1></div>
        <button onClick={openNewAlbum} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-xl hover:bg-red-700"><Plus size={16}/>新建相册</button>
      </div>
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-text-sub text-xs"><th className="p-3 pl-4">相册</th><th className="p-3 pr-4">操作</th></tr></thead>
          <tbody>{albums.map(a=>(<tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50"><td className="p-3 pl-4 font-medium">{a.title}</td>
            <td className="p-3 pr-4">
              <button onClick={()=>openPhotos(a)} className="px-2 py-1 text-xs bg-secondary/10 text-secondary rounded-lg mr-1 hover:bg-secondary/20"><Upload size={13} className="inline mr-0.5"/>管理照片</button>
              <button onClick={()=>openEditAlbum(a)} className="p-1 text-gray-400 hover:text-secondary mr-1"><Edit2 size={15}/></button>
              <button onClick={()=>handleDeleteAlbum(a.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={15}/></button>
            </td></tr>))}</tbody>
        </table>
      </div>

      {/* Album Modal */}
      {showA && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=>setShowA(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{editId?'编辑相册':'新建相册'}</h2><button onClick={()=>setShowA(false)}><X size={18}/></button></div>
            <form onSubmit={handleSaveAlbum} className="p-4 space-y-3">
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="相册名称 *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
              <input className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" placeholder="描述" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">{saving?'保存中...':'保存'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showP && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=>setShowP(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{currentAlbum?.title} - 照片</h2><button onClick={()=>setShowP(false)}><X size={18}/></button></div>
            <div className="p-3 border-b flex gap-2 flex-wrap items-end">
              <input type="file" accept="image/*" multiple onChange={e=>setUploadFiles(Array.from(e.target.files || []))} className="text-sm"/>
              <input className="px-2 py-1.5 bg-gray-50 border rounded-lg text-xs flex-1" placeholder="说明" value={caption} onChange={e=>setCaption(e.target.value)}/>
              <button onClick={handleUpload} disabled={uploading} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">
                {uploading ? `上传中 ${uploadProgress.done}/${uploadProgress.total}` : `上传${uploadFiles.length ? ` ${uploadFiles.length} 张` : ''}`}
              </button>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2">
              {photos.map(p=>(
                <div key={p.id} className="relative group">
                  <img src={p.url} className="aspect-square object-cover rounded-lg w-full"/>
                  <button onClick={()=>handleDeletePhoto(p.id)} className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="删除"><X size={12}/></button>
                  <button onClick={()=>{setMoveTarget(p); setMoveAlbumId('');}} className="absolute top-1 left-1 p-0.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="移动到其他相册"><ArrowRight size={12}/></button>
                </div>
              ))}
              {photos.length===0 && <p className="col-span-3 text-center text-sm text-text-sub py-8">暂无照片</p>}
            </div>
          </div>
        </div>
      )}

      {/* Move Photo Modal */}
      {moveTarget && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={()=>setMoveTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">移动照片到相册</h2><button onClick={()=>setMoveTarget(null)}><X size={18}/></button></div>
            <div className="p-4 space-y-3">
              <select className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" value={moveAlbumId} onChange={e=>setMoveAlbumId(e.target.value)}>
                <option value="">选择目标相册...</option>
                {albums.filter(a=>a.id!==currentAlbum?.id).map(a=><option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
              <button onClick={handleMove} disabled={!moveAlbumId} className="w-full py-2.5 bg-primary text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50">移动</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
