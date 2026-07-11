'use client';

import { Card } from '@/components/shared/Card';
import { TrendingUp, Minus } from 'lucide-react';
import type { DashboardApiData } from '@/hooks/useDashboardData';
import { ContestCalendar } from '@/components/dashboard/ContestCalendar';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { ActivityCheckupRow } from '@/components/dashboard/ActivityCheckupRow';
import { ProblemDistributionCard } from '@/components/dashboard/ProblemDistributionCard';
import { useUIStore } from '@/store/useUIStore';

interface HeroStatsProps {
  data?: DashboardApiData;
  loading?: boolean;
}

function AccentStreak({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        borderLeft: '2px solid ' + color,
        background: 'linear-gradient(180deg, ' + color + '22 0%, transparent 44%)',
        pointerEvents: 'none',
      }}
    />
  );
}

export function HeroStats({ data, loading }: HeroStatsProps) {
  const cf = data?.platforms.codeforces;
  const lc = data?.platforms.leetcode;
  const { selectedPlatform } = useUIStore();
  const contestCount = data?.ratingChartData.filter((point) => typeof point.cfRating === 'number' || typeof point.lcRating === 'number').length ?? 0;
  const rating = selectedPlatform === 'CODEFORCES' ? cf?.currentRating ?? null : lc?.contestRating ?? null;
  const maxRating = selectedPlatform === 'CODEFORCES' ? cf?.maxRating ?? null : lc?.contestRating ?? null;
  const isGrowing = selectedPlatform === 'CODEFORCES' ? (cf?.currentRating ?? 0) > 1200 : (lc?.contestRating ?? 0) > 1500;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3 xl:h-full xl:grid-rows-[minmax(128px,1fr)_104px]">
        <Card variant="raised" className="min-h-[128px] overflow-hidden" padding="16px 18px">
          <AccentStreak color="var(--accent-blue)" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Current Rating
              </span>
              <PlatformLogo platform={selectedPlatform} size={30} />
            </div>
            {loading ? (
              <div className="space-y-2">
                <div className="skeleton h-9 w-24" />
                <div className="skeleton h-6 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="font-mono-data" style={{ fontSize: '2.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 0.95 }}>
                    {rating != null ? Math.round(rating).toLocaleString() : '-'}
                  </span>
                  {rating && <span className="mb-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--accent-green)' }}>+12</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(79,142,247,0.10)', border: '1px solid rgba(79,142,247,0.18)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--accent-blue)' }}>Max</p>
                    <p className="font-mono-data text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{maxRating ? Math.round(maxRating).toLocaleString() : '-'}</p>
                  </div>
                  <div className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.18)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--accent-purple)' }}>Contests</p>
                    <p className="font-mono-data text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{contestCount}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        <ProblemDistributionCard data={data} platform={selectedPlatform} loading={loading}>
          <AccentStreak color="var(--accent-green)" />
        </ProblemDistributionCard>

        <Card variant="base" className="min-h-[128px] overflow-hidden" padding="16px 18px">
          <AccentStreak color="var(--accent-amber)" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Growth Insight
              </span>
              {isGrowing ? <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} /> : <Minus size={18} style={{ color: 'var(--text-muted)' }} />}
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ) : (
              <>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                  {isGrowing ? 'Consistent practice is lifting your rating trend this month.' : 'Focus on targeted practice sets to unlock the next jump.'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <span className="rounded-lg px-2.5 py-2 text-[11px] font-semibold" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)', color: 'var(--accent-amber)' }}>
                    {isGrowing ? 'On pace' : 'Focus block'}
                  </span>
                  <span className="rounded-lg px-2.5 py-2 text-[11px] font-semibold" style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.18)', color: 'var(--accent-green)' }}>
                    {selectedPlatform === 'CODEFORCES' ? 'Rating +35' : 'Contest +29'}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

        <ActivityCheckupRow data={data} loading={loading} className="sm:col-span-3" />
      </div>

      <ContestCalendar data={data?.ratingChartData ?? []} loading={loading} />
    </div>
  );
}
