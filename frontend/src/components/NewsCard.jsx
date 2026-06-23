import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function NewsCard({ news }) {
  return (
    <Link
      to={`/news/${news.id}`}
      className="bg-white rounded-2xl card-shadow overflow-hidden flex flex-col hover:scale-[1.01] transition-transform"
    >
      {/* 封面图 */}
      <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        {news.cover_image ? (
          <img src={news.cover_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText size={36} className="text-gray-300" />
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* 置顶标识 */}
        <div className="flex items-center gap-2 mb-1.5">
          {news.is_pinned === 1 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
              置顶
            </span>
          )}
          <span className="text-xs text-text-sub">{news.published_at?.substring(0, 10)}</span>
        </div>

        <h3 className="font-semibold text-text-main text-sm line-clamp-2 mb-1.5">
          {news.title}
        </h3>

        {news.summary && (
          <p className="text-xs text-text-sub line-clamp-2 flex-1">{news.summary}</p>
        )}
      </div>
    </Link>
  );
}
