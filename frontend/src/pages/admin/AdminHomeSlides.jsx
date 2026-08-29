import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Eye,
  EyeOff,
  ImagePlus,
  Images,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  createHomeSlide,
  deleteHomeSlide,
  listAlbums,
  listHomeSlides,
  reorderHomeSlides,
  updateHomeSlide,
  uploadImage,
} from '../../api/admin';
import { getAlbumPhotos } from '../../api/public';
import ImageUploader from '../../components/ImageUploader';

const EMPTY_FORM = {
  image_url: '',
  alt_text: '',
  object_position: 'center',
  is_active: true,
};

const POSITION_LABELS = {
  center: '居中',
  top: '靠上',
  bottom: '靠下',
};

const POSITION_CLASSES = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
};

export default function AdminHomeSlides() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [message, setMessage] = useState('');
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const loadSlides = async () => {
    try {
      setSlides((await listHomeSlides()).data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const loadAlbums = async () => {
    if (albums.length > 0) return;
    try {
      setAlbums((await listAlbums()).data);
    } catch (error) {
      setMessage(`相册读取失败：${error.message}`);
    }
  };

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setSelectedAlbumId('');
    setAlbumPhotos([]);
    setMessage('');
    setModalOpen(true);
    loadAlbums();
  };

  const openEdit = slide => {
    setEditId(slide.id);
    setForm({
      image_url: slide.image_url,
      alt_text: slide.alt_text,
      object_position: slide.object_position || 'center',
      is_active: Number(slide.is_active) === 1,
    });
    setSelectedAlbumId('');
    setAlbumPhotos([]);
    setMessage('');
    setModalOpen(true);
    loadAlbums();
  };

  const handleUpload = async file => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await uploadImage(formData);
    setForm(current => ({ ...current, image_url: response.data.url }));
    return response.data.url;
  };

  const handleAlbumChange = async event => {
    const albumId = event.target.value;
    setSelectedAlbumId(albumId);
    setAlbumPhotos([]);
    if (!albumId) return;
    setLoadingPhotos(true);
    try {
      setAlbumPhotos((await getAlbumPhotos(albumId)).data);
    } catch (error) {
      setMessage(`相册照片读取失败：${error.message}`);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!form.image_url) return setMessage('请先上传或选择一张轮播图片');
    if (!form.alt_text.trim()) return setMessage('请填写图片说明');
    setSaving(true);
    setMessage('');
    try {
      if (editId) await updateHomeSlide(editId, form);
      else await createHomeSlide(form);
      await loadSlides();
      setModalOpen(false);
      setMessage(editId ? '轮播图片已更新' : '轮播图片已添加');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async slide => {
    if (!window.confirm(`确定删除轮播图片“${slide.alt_text}”吗？`)) return;
    try {
      await deleteHomeSlide(slide.id);
      setSlides(current => current.filter(item => item.id !== slide.id));
      setMessage('轮播图片已删除');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const moveSlide = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length || reordering) return;
    const previous = slides;
    const next = [...slides];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setSlides(next);
    setReordering(true);
    setMessage('');
    try {
      const response = await reorderHomeSlides(next.map(slide => slide.id));
      setSlides(response.data);
      setMessage('首页显示顺序已更新');
    } catch (error) {
      setSlides(previous);
      setMessage(error.message);
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(item => <div key={item} className="skeleton h-32 rounded-2xl" />)}</div>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-main">首页轮播管理</h1>
          <p className="mt-1 text-sm text-text-sub">从上到下依次展示；隐藏的图片不会出现在首页。</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="min-h-11 shrink-0 inline-flex items-center gap-1.5 px-4 bg-primary text-white text-sm font-medium rounded-xl hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus size={17} aria-hidden="true" /> 添加图片
        </button>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-blue-50 text-secondary text-sm" role="status">
          {message}
        </div>
      )}

      {slides.length === 0 ? (
        <div className="bg-white rounded-2xl card-shadow p-10 text-center">
          <ImagePlus size={34} className="mx-auto text-gray-300" aria-hidden="true" />
          <p className="mt-3 text-sm text-text-sub">还没有轮播图片，添加后就会显示在首页。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <article key={slide.id} className="bg-white rounded-2xl card-shadow p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative w-full sm:w-48 lg:w-60 aspect-[16/7] shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={slide.image_url}
                  alt={slide.alt_text}
                  className={`w-full h-full object-cover ${POSITION_CLASSES[slide.object_position] || 'object-center'}`}
                />
                <span className="absolute left-2 top-2 min-w-7 h-7 px-2 inline-flex items-center justify-center rounded-lg bg-black/65 text-white text-xs font-semibold">
                  {index + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-text-main truncate">{slide.alt_text}</h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${slide.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {slide.is_active ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}
                    {slide.is_active ? '首页显示' : '已隐藏'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-sub">裁切焦点：{POSITION_LABELS[slide.object_position] || '居中'}</p>
              </div>

              <div className="flex items-center gap-1 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => moveSlide(index, -1)}
                  disabled={index === 0 || reordering}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={`将${slide.alt_text}上移`}
                ><ArrowUp size={18} /></button>
                <button
                  type="button"
                  onClick={() => moveSlide(index, 1)}
                  disabled={index === slides.length - 1 || reordering}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={`将${slide.alt_text}下移`}
                ><ArrowDown size={18} /></button>
                <button
                  type="button"
                  onClick={() => openEdit(slide)}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-secondary hover:bg-blue-50"
                  aria-label={`编辑${slide.alt_text}`}
                ><Edit2 size={18} /></button>
                <button
                  type="button"
                  onClick={() => handleDelete(slide)}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50"
                  aria-label={`删除${slide.alt_text}`}
                ><Trash2 size={18} /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="slide-modal-title">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full h-[calc(100dvh-0.5rem)] sm:h-auto sm:max-h-[92vh] sm:max-w-3xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 sm:px-5 py-4 border-b">
              <h2 id="slide-modal-title" className="font-semibold">{editId ? '编辑轮播图片' : '添加轮播图片'}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="w-11 h-11 -my-2 inline-flex items-center justify-center rounded-xl hover:bg-gray-100" aria-label="关闭">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">轮播图片 *</label>
                <ImageUploader
                  currentUrl={form.image_url}
                  onUpload={handleUpload}
                  onRemove={() => setForm(current => ({ ...current, image_url: '' }))}
                  previewSize="h-52 sm:h-64"
                />
              </div>

              <details className="rounded-xl border border-gray-200">
                <summary className="min-h-11 px-3 cursor-pointer list-none inline-flex items-center gap-2 text-sm font-medium text-secondary">
                  <Images size={17} aria-hidden="true" /> 或从照片墙选择
                </summary>
                <div className="px-3 pb-3 space-y-3">
                  <label className="block text-sm text-text-main">
                    相册
                    <select value={selectedAlbumId} onChange={handleAlbumChange} className="mt-1.5 w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                      <option value="">请选择相册</option>
                      {albums.map(album => <option key={album.id} value={album.id}>{album.title}</option>)}
                    </select>
                  </label>
                  {loadingPhotos ? (
                    <div className="skeleton h-28 rounded-xl" />
                  ) : albumPhotos.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                      {albumPhotos.map(photo => (
                        <button
                          type="button"
                          key={photo.id}
                          onClick={() => setForm(current => ({
                            ...current,
                            image_url: photo.url,
                            alt_text: current.alt_text || photo.caption || '球队精彩瞬间',
                          }))}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 ${form.image_url === photo.url ? 'border-primary' : 'border-transparent'}`}
                          aria-label={`选择${photo.caption || '这张照片'}`}
                        >
                          <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : selectedAlbumId ? (
                    <p className="text-sm text-text-sub">这个相册暂时没有照片。</p>
                  ) : null}
                </div>
              </details>

              <label className="block text-sm font-medium text-text-main">
                图片说明 *
                <input
                  required
                  maxLength={120}
                  value={form.alt_text}
                  onChange={event => setForm(current => ({ ...current, alt_text: event.target.value }))}
                  className="mt-1.5 w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  placeholder="例如：球队夺冠后的捧杯时刻"
                />
                <span className="block mt-1 text-xs text-text-sub">用于图片无法显示时的说明，也方便无障碍阅读。</span>
              </label>

              <label className="block text-sm font-medium text-text-main">
                裁切焦点
                <select
                  value={form.object_position}
                  onChange={event => setForm(current => ({ ...current, object_position: event.target.value }))}
                  className="mt-1.5 w-full min-h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="center">居中（通常适合合照）</option>
                  <option value="top">靠上（人物头部靠近顶部时）</option>
                  <option value="bottom">靠下（主体靠近底部时）</option>
                </select>
              </label>

              {form.image_url && (
                <div>
                  <p className="text-sm font-medium text-text-main mb-2">首页裁切预览</p>
                  <div className="grid sm:grid-cols-[1fr_150px] gap-3 items-start">
                    <figure>
                      <div className="aspect-[16/6] overflow-hidden rounded-xl bg-slate-100">
                        <img src={form.image_url} alt="桌面端裁切预览" className={`w-full h-full object-cover ${POSITION_CLASSES[form.object_position]}`} />
                      </div>
                      <figcaption className="mt-1 text-xs text-text-sub">桌面端</figcaption>
                    </figure>
                    <figure>
                      <div className="aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
                        <img src={form.image_url} alt="手机端裁切预览" className={`w-full h-full object-cover ${POSITION_CLASSES[form.object_position]}`} />
                      </div>
                      <figcaption className="mt-1 text-xs text-text-sub">手机端</figcaption>
                    </figure>
                  </div>
                </div>
              )}

              <label className="min-h-11 flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={event => setForm(current => ({ ...current, is_active: event.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium text-text-main">在首页显示</span>
                  <span className="block text-xs text-text-sub">取消勾选可暂时隐藏，不会删除图片记录。</span>
                </span>
              </label>

              {message && <p className="text-sm text-red-600" role="alert">{message}</p>}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 px-4 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">取消</button>
                <button type="submit" disabled={saving} className="min-h-11 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {saving ? '保存中…' : '保存轮播图片'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
