import { cn } from '@/lib/utils';
import { PlatformLogo } from '@/components/shared/PlatformLogo';

interface PlatformBadgeProps {
  platform: 'CODEFORCES' | 'LEETCODE';
  size?: number;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const isCF = platform === 'CODEFORCES';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'font-mono-data text-xs font-medium',
        'leading-none select-none',
        className,
      )}
      title={isCF ? 'Codeforces' : 'LeetCode'}
      aria-label={isCF ? 'Codeforces' : 'LeetCode'}
      style={
        isCF
          ? {
              color: '#ff6b6b',
              background: 'transparent',
              border: 'none',
            }
          : {
              color: 'var(--accent-amber)',
              background: 'transparent',
              border: 'none',
            }
      }
    >
      <PlatformLogo platform={platform} size={20} />
    </span>
  );
}
