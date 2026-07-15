'use client';

import { Card } from '@/components/shared/Card';
import { TrendingUp, Minus, BarChart3 } from 'lucide-react';
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
        <Card variant="raised" className="min-h-[128px] overflow-hidden" padding="20px 24px">
          <AccentStreak color="var(--brand)" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Current Rating
              </span>
              <div className="flex items-center gap-2">
                <PlatformLogo platform={selectedPlatform} size={24} />
              </div>
            </div>
            {loading ? (
              <div className="space-y-2">
                <div className="skeleton h-9 w-24" />
                <div className="skeleton h-6 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3">
                  <span className="font-mono-data" style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.045em', lineHeight: 0.9 }}>
                    {rating != null ? Math.round(rating).toLocaleString() : '-'}
                  </span>
                  {rating && <span className="mb-0.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--success-dim)', border: '1px solid var(--border-default)', color: 'var(--success)' }}>+12</span>}
                </div>
                <div className="grid grid-cols-2 divide-x rounded-[20px] px-5 py-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-default)', borderColor: 'var(--border-default)' }}>
                  <div className="pr-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--gray-400)' }}>Max Rating</p>
                    <p className="mt-1 font-mono-data text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{maxRating ? Math.round(maxRating).toLocaleString() : '-'}</p>
                  </div>
                  <div className="pl-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--gray-400)' }}>Contests</p>
                    <p className="mt-1 font-mono-data text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{contestCount}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        <ProblemDistributionCard data={data} platform={selectedPlatform} loading={loading}>
          <AccentStreak color="var(--gray-400)" />
        </ProblemDistributionCard>

        <Card variant="base" className="min-h-[128px] overflow-hidden" padding="20px 24px">
          <AccentStreak color="var(--gray-400)" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Growth Insight
              </span>
              {isGrowing ? <TrendingUp size={18} style={{ color: 'var(--success)' }} /> : <Minus size={18} style={{ color: 'var(--text-muted)' }} />}
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ) : (
              <>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.35, margin: 0, maxWidth: '29ch' }}>
                  {isGrowing ? 'Consistent practice is lifting your rating trend this month.' : 'Focus on targeted practice sets to unlock the next jump.'}
                </p>
                <div className="grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="rounded-full px-3 py-2 text-center text-[12px] font-semibold" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.38)', color: 'var(--accent-amber)' }}>
                    {isGrowing ? 'On pace' : 'Focus block'}
                  </span>
                  <span className="rounded-full px-3 py-2 text-center text-[12px] font-semibold" style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.34)', color: 'var(--accent-green)' }}>
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
