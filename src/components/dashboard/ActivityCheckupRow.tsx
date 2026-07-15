'use client';

import { Card } from '@/components/shared/Card';
import { Calendar, Zap, Clock } from 'lucide-react';
import type { DashboardApiData } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';

export function ActivityCheckupRow({ data, loading, className }: { data?: DashboardApiData, loading?: boolean, className?: string }) {
  const activeDays = data?.streak?.totalActiveDays ?? 0;
  const streak = data?.streak?.currentStreak ?? 0;
  // Mock average gap based on active days, if not available directly
  const avgGap = Math.max(1, Math.round(180 / (activeDays || 1)));

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-3', className)}>
      <Card variant="base" padding="14px 16px" className="relative min-h-[104px] overflow-hidden">
        <Calendar size={20} className="absolute top-4 right-4" style={{ color: 'var(--text-secondary)' }} />
        <span
          className="font-mono-data"
          style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}
        >
          {loading ? '--' : activeDays}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: '8px' }}>
          days active (6 months)
        </span>
      </Card>

      <Card variant="base" padding="14px 16px" className="relative min-h-[104px] overflow-hidden">
        <Zap size={20} className="absolute top-4 right-4" style={{ color: 'var(--text-secondary)' }} />
        <span
          className="font-mono-data"
          style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}
        >
          {loading ? '--' : streak}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: '8px' }}>
          day streak
        </span>
      </Card>

      <Card variant="base" padding="14px 16px" className="relative min-h-[104px] overflow-hidden">
        <Clock size={20} className="absolute top-4 right-4" style={{ color: 'var(--text-secondary)' }} />
        <span
          className="font-mono-data flex items-baseline gap-1"
          style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}
        >
          {loading ? '--' : avgGap}
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontWeight: 500 }}>days</span>
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: '8px' }}>
          between submissions
        </span>
      </Card>
    </div>
  );
}
