import { useState, useEffect } from 'react';
import { getNews } from '../api/public';
import NewsCard from '../components/NewsCard';
import EmptyState from '../components/EmptyState';

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 9;

  useEffect(() => {
    setLoading(true);
    getNews({ page, limit })
      .then(res => { setNews(res.data.list); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text-main mb-2">新闻公告</h1>
      <p className="text-text-sub text-sm mb-8">球队动态与招新公告</p>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : news.length === 0 ? (
        <EmptyState icon="📰" title="暂无新闻" />
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {news.map(n => <NewsCard key={n.id} news={n} />)}
          </div>
          {total > limit && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-white card-shadow disabled:opacity-40">上一页</button>
              <span className="text-sm text-text-sub">{page} / {Math.ceil(total / limit)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}
                className="px-3 py-1.5 text-sm rounded-lg bg-white card-shadow disabled:opacity-40">下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
