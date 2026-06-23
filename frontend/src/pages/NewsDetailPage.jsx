import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNewsById } from '../api/public';
import { ArrowLeft, CalendarDays } from 'lucide-react';

export default function NewsDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNewsById(id)
      .then(res => setArticle(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-sub">新闻不存在</p>
        <Link to="/news" className="text-secondary hover:underline text-sm mt-2 inline-block">返回新闻列表</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/news" className="inline-flex items-center gap-1 text-sm text-text-sub hover:text-text-main mb-6 transition-colors">
        <ArrowLeft size={16} /> 返回新闻列表
      </Link>

      <article className="bg-white rounded-2xl card-shadow overflow-hidden">
        {/* 封面图 */}
        {article.cover_image && (
          <div className="h-56 bg-gray-100 flex items-center justify-center">
            <img src={article.cover_image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-xl font-bold text-text-main mb-3">{article.title}</h1>
          <div className="flex items-center gap-3 text-xs text-text-sub mb-6">
            <span className="flex items-center gap-1"><CalendarDays size={12} /> {article.published_at?.substring(0, 10)}</span>
            {article.is_pinned === 1 && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">置顶</span>}
          </div>
          <div className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
            {article.content || '暂无内容'}
          </div>
        </div>
      </article>
    </div>
  );
}
