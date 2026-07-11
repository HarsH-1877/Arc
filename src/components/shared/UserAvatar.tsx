import { cn, getInitials } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  ringColor?: string;
  className?: string;
}

export function UserAvatar({
  src,
  name,
  size = 32,
  ringColor,
  className,
}: UserAvatarProps) {
  const initials = getInitials(name);

  const ringStyle = ringColor
    ? {
        outline: `2px solid ${ringColor}`,
        outlineOffset: '2px',
      }
    : undefined;

  const sharedStyle = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: '50%',
    ...ringStyle,
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn('object-cover', className)}
        style={sharedStyle}
        referrerPolicy="no-referrer"
      />
    );
  }

  const fontSize = Math.max(10, Math.floor(size * 0.38));

  return (
    <div
      className={cn('flex items-center justify-center select-none shrink-0', className)}
      style={{
        ...sharedStyle,
        background: 'var(--bg-surface-3)',
        color: 'var(--text-primary)',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.03em',
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
