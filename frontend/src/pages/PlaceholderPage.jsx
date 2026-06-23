// Phase 3 会替换为真实页面，当前仅作为路由占位
export default function PlaceholderPage({ title = '页面' }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4 opacity-20">⚽</div>
      <h1 className="text-2xl font-bold text-text-main mb-2">{title}</h1>
      <p className="text-text-sub text-sm">该页面将在后续 Phase 中实现</p>
    </div>
  );
}
