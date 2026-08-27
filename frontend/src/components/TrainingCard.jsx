import { CalendarDays, Clock, MapPin } from 'lucide-react';

const STATUS_CONFIG = {
  upcoming: { label: '即将进行', color: 'text-green-600 bg-green-50' },
  completed: { label: '已完成', color: 'text-text-sub bg-gray-100' },
  cancelled: { label: '已取消', color: 'text-red-500 bg-red-50 line-through' },
};

export default function TrainingCard({ schedule }) {
  const cfg = STATUS_CONFIG[schedule.status] || STATUS_CONFIG.upcoming;

  return (
    <div className={`bg-white rounded-2xl card-shadow p-4 ${schedule.status === 'cancelled' ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-text-main">{schedule.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-text-sub">
        <span className="flex items-center gap-1"><CalendarDays size={12} /> {schedule.schedule_date}</span>
        {schedule.start_time && (
          <span className="flex items-center gap-1">
            <Clock size={12} /> {schedule.start_time}{schedule.end_time ? ` - ${schedule.end_time}` : ''}
          </span>
        )}
        {schedule.location && (
          <span className="flex items-center gap-1"><MapPin size={12} /> {schedule.location}</span>
        )}
      </div>
      {schedule.description && (
        <p className="text-xs text-text-sub mt-2 line-clamp-2">{schedule.description}</p>
      )}
    </div>
  );
}
