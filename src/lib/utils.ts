import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getRatingColor(rating: number): string {
  if (rating < 1200) return 'var(--rating-newbie)';
  if (rating < 1400) return 'var(--rating-pupil)';
  if (rating < 1600) return 'var(--rating-specialist)';
  if (rating < 1900) return 'var(--rating-expert)';
  if (rating < 2100) return 'var(--rating-cm)';
  if (rating < 2400) return 'var(--rating-master)';
  return 'var(--rating-gm)';
}

export function getRatingTier(rating: number): string {
  if (rating < 1200) return 'newbie';
  if (rating < 1400) return 'pupil';
  if (rating < 1600) return 'specialist';
  if (rating < 1900) return 'expert';
  if (rating < 2100) return 'cm';
  if (rating < 2400) return 'master';
  return 'gm';
}

export function getHeatmapLevel(count: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  if (count <= 9) return 4;
  return 5;
}

export function getHeatmapColor(level: 0 | 1 | 2 | 3 | 4 | 5): string {
  const colors = [
    'var(--heatmap-0)',
    'var(--heatmap-1)',
    'var(--heatmap-2)',
    'var(--heatmap-3)',
    'var(--heatmap-4)',
    'var(--heatmap-5)',
  ] as const;
  return colors[level];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarUrl(name: string, size = 128): string {
  const initials = getInitials(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=1B2438&color=F0F4FF&bold=true`;
}

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[arc]', ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info('[arc]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[arc]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[arc]', ...args);
  },
};
