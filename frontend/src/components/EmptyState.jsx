export default function EmptyState({ icon = '📭', title = '暂无内容', description = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4 opacity-30">{icon}</span>
      <h3 className="text-lg font-medium text-text-sub mb-1">{title}</h3>
      {description && <p className="text-sm text-text-sub opacity-70">{description}</p>}
    </div>
  );
}
