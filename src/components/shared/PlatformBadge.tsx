import { cn } from '@/lib/utils';
import { PlatformLogo } from '@/components/shared/PlatformLogo';

interface PlatformBadgeProps {
  platform: 'CODEFORCES' | 'LEETCODE' | 'CODECHEF';
  size?: number;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const isCF = platform === 'CODEFORCES';
  const isLC = platform === 'LEETCODE';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'font-mono-data text-xs font-medium',
        'leading-none select-none',
        className,
      )}
      title={isCF ? 'Codeforces' : isLC ? 'LeetCode' : 'CodeChef'}
      aria-label={isCF ? 'Codeforces' : isLC ? 'LeetCode' : 'CodeChef'}
      style={
        isCF
          ? {
              color: '#ff6b6b',
              background: 'transparent',
              border: 'none',
            }
          : isLC
          ? {
              color: 'var(--accent-amber)',
              background: 'transparent',
              border: 'none',
            }
          : {
              color: '#d97706',
              background: 'transparent',
              border: 'none',
            }
      }
    >
      <PlatformLogo platform={platform} size={20} />
    </span>
  );
}
