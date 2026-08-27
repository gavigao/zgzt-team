import { User } from 'lucide-react';

const SIZES = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export default function UserAvatar({ src, name, size = 'md', className = '' }) {
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden bg-secondary/10 flex items-center justify-center shrink-0 ${className}`}
      title={name || '用户头像'}
    >
      {src ? (
        <img src={src} alt={`${name || '用户'}的头像`} className="w-full h-full object-cover" />
      ) : (
        <User className="text-secondary" size={size === 'xl' ? 36 : size === 'lg' ? 24 : 15} />
      )}
    </div>
  );
}
