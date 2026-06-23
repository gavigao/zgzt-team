import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAlbumPhotos } from '../api/public';
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PhotoAlbumPage() {
  const { albumId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null); // 当前大图浏览的索引

  useEffect(() => {
    getAlbumPhotos(albumId)
      .then(res => setPhotos(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [albumId]);

  // 键盘导航
  useEffect(() => {
    if (viewing === null) return;
    const handler = (e) => {
      if (e.key === 'Escape') setViewing(null);
      if (e.key === 'ArrowRight') setViewing(v => Math.min(photos.length - 1, v + 1));
      if (e.key === 'ArrowLeft') setViewing(v => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewing, photos.length]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/photos" className="inline-flex items-center gap-1 text-sm text-text-sub hover:text-text-main mb-6 transition-colors">
        <ArrowLeft size={16} /> 返回相册列表
      </Link>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 text-text-sub text-sm">相册中暂无照片</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((p, i) => (
            <div
              key={p.id}
              onClick={() => setViewing(i)}
              className="aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <img src={p.url} alt={p.caption || ''} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* 大图浏览 */}
      {viewing !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setViewing(null)}>
          <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white" onClick={() => setViewing(null)}>
            <X size={28} />
          </button>
          <button
            className="absolute left-4 p-2 text-white/70 hover:text-white disabled:opacity-30"
            disabled={viewing === 0}
            onClick={e => { e.stopPropagation(); setViewing(v => Math.max(0, v - 1)); }}
          >
            <ChevronLeft size={36} />
          </button>
          <img
            src={photos[viewing]?.url}
            alt={photos[viewing]?.caption || ''}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 p-2 text-white/70 hover:text-white disabled:opacity-30"
            disabled={viewing === photos.length - 1}
            onClick={e => { e.stopPropagation(); setViewing(v => Math.min(photos.length - 1, v + 1)); }}
          >
            <ChevronRight size={36} />
          </button>
          {photos[viewing]?.caption && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-xl">
              {photos[viewing].caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
