'use client';

import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { cn, getRatingColor } from '@/lib/utils';

interface RatingBadgeProps {
  platform: 'codeforces' | 'leetcode';
  rating: number | null;
  className?: string;
}

function getBackgroundTint(color: string): string {
  const tintMap: Record<string, string> = {
    'var(--rating-newbie)': 'rgba(128, 128, 128, 0.10)',
    'var(--rating-pupil)': 'rgba(0, 128, 0, 0.10)',
    'var(--rating-specialist)': 'rgba(3, 168, 158, 0.10)',
    'var(--rating-expert)': 'rgba(0, 0, 255, 0.10)',
    'var(--rating-cm)': 'rgba(170, 0, 170, 0.10)',
    'var(--rating-master)': 'rgba(255, 140, 0, 0.10)',
    'var(--rating-gm)': 'rgba(255, 0, 0, 0.10)',
    'var(--accent-cyan)': 'rgba(6, 182, 212, 0.10)',
  };
  return tintMap[color] ?? 'rgba(255,255,255,0.06)';
}

export function RatingBadge({ platform, rating, className }: RatingBadgeProps) {
  const logoPlatform = platform === 'codeforces' ? 'CODEFORCES' : 'LEETCODE';

  if (rating === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-mono-data',
          className,
        )}
        style={{
          background: 'var(--bg-surface-3)',
          color: 'var(--text-tertiary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <PlatformLogo platform={logoPlatform} size={18} />
        <span>-</span>
      </span>
    );
  }

  const color = platform === 'codeforces' ? getRatingColor(rating) : 'var(--accent-cyan)';
  const bgTint = getBackgroundTint(color);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-mono-data',
        className,
      )}
      style={{
        background: bgTint,
        color,
        border: `1px solid ${bgTint}`,
      }}
    >
      <PlatformLogo platform={logoPlatform} size={18} />
      <span>{rating}</span>
    </span>
  );
}
