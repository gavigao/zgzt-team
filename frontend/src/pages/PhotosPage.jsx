import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAlbums } from '../api/public';
import EmptyState from '../components/EmptyState';
import { FolderOpen, Image } from 'lucide-react';

export default function PhotosPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlbums()
      .then(res => setAlbums(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-2">照片墙</h1>
      <p className="text-text-sub text-sm mb-8">球队活动与比赛瞬间</p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : albums.length === 0 ? (
        <EmptyState icon="📸" title="暂无相册" description="相册将在后台添加后展示" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map(a => (
            <Link
              key={a.id}
              to={`/photos/${a.id}`}
              className="bg-white rounded-2xl card-shadow overflow-hidden hover:scale-[1.02] transition-transform"
            >
              <div className="h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                {a.cover_photo_url ? (
                  <img src={a.cover_photo_url} alt={`${a.title}相册封面`} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Image size={32} className="text-gray-300" />
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-text-main flex items-center gap-1.5">
                  <FolderOpen size={14} className="text-text-sub" /> {a.title}
                </h3>
                {a.description && (
                  <p className="text-xs text-text-sub mt-1 line-clamp-1">{a.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">{Number(a.photo_count || 0)} 张照片</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
