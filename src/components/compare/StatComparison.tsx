'use client';

import type { CompareUser } from '@/hooks/useCompareData';
import { useUIStore } from '@/store/useUIStore';
import { Flame, Trophy, CheckCircle2, TrendingUp } from 'lucide-react';

interface StatComparisonProps {
  user: CompareUser;
  friend: CompareUser;
}

function formatValue(value: number | null, fallback = '0') {
  if (value == null || Number.isNaN(value)) return fallback;
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}

function longestStreak(days: { date: string; count: number }[]) {
  const active = new Set(days.filter((day) => day.count > 0).map((day) => day.date));
  const sorted = Array.from(active).sort();
  let best = 0;
  let current = 0;
  let previous = '';
  for (const date of sorted) {
    const prevDate = previous ? new Date(previous) : null;
    const currDate = new Date(date);
    const diff = prevDate ? Math.round((currDate.getTime() - prevDate.getTime()) / 86400000) : 0;
    current = previous && diff === 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }
  return best;
}

function averageGap(days: { date: string; count: number }[]) {
  const active = days.filter((day) => day.count > 0).map((day) => day.date).sort();
  if (active.length < 2) return null;
  let total = 0;
  for (let index = 1; index < active.length; index++) {
    total += Math.max(0, Math.round((new Date(active[index]).getTime() - new Date(active[index - 1]).getTime()) / 86400000));
  }
  return total / (active.length - 1);
}

export function StatComparison({ user, friend }: StatComparisonProps) {
  const { selectedPlatform } = useUIStore();
  const stats = selectedPlatform === 'CODEFORCES' ? [
    { label: 'CF Rating', userValue: user.cfRating, friendValue: friend.cfRating, userMeta: `(${formatValue(user.cfMaxRating)} max)`, friendMeta: `(${formatValue(friend.cfMaxRating)} max)`, lowerWins: false },
    { label: 'Avg. Rank', userValue: user.cfAverageRank, friendValue: friend.cfAverageRank, userMeta: `(${user.cfContestCount} contests)`, friendMeta: `(${friend.cfContestCount} contests)`, lowerWins: true },
    { label: 'CF Solved', userValue: user.cfSolvedCount, friendValue: friend.cfSolvedCount, userMeta: null, friendMeta: null, lowerWins: false },
    { label: 'Longest Streak', userValue: longestStreak(user.cfHeatmapData || user.heatmapData), friendValue: longestStreak(friend.cfHeatmapData || friend.heatmapData), userMeta: null, friendMeta: null, lowerWins: false },
  ] : [
    { label: 'LC Rating', userValue: user.lcRating, friendValue: friend.lcRating, userMeta: `(${formatValue(user.lcMaxRating)} max)`, friendMeta: `(${formatValue(friend.lcMaxRating)} max)`, lowerWins: false },
    { label: 'Avg. Rank', userValue: user.lcAverageRank, friendValue: friend.lcAverageRank, userMeta: `(${user.lcContestCount} contests)`, friendMeta: `(${friend.lcContestCount} contests)`, lowerWins: true },
    { label: 'LC Solved', userValue: user.lcSolvedCount, friendValue: friend.lcSolvedCount, userMeta: null, friendMeta: null, lowerWins: false },
    { label: 'Longest Streak', userValue: longestStreak(user.lcHeatmapData || user.heatmapData), friendValue: longestStreak(friend.lcHeatmapData || friend.heatmapData), userMeta: null, friendMeta: null, lowerWins: false },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const userValue = stat.userValue;
        const friendValue = stat.friendValue;
        const userNumber = userValue ?? Number.POSITIVE_INFINITY;
        const friendNumber = friendValue ?? Number.POSITIVE_INFINITY;
        const userWins = stat.lowerWins ? userNumber <= friendNumber : userNumber >= friendNumber;
        const friendWins = stat.lowerWins ? friendNumber <= userNumber : friendNumber >= userNumber;
        const delta = userValue != null && friendValue != null ? Math.abs(userValue - friendValue) : null;

        return (
          <div key={stat.label} className="card card-glow flex flex-col gap-4 rounded-md p-4">
            <div className="flex items-center justify-between gap-3">
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{stat.label}</span>
              {delta != null && <span className="font-mono-data rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>Delta {formatValue(delta)}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricSide label="You" value={formatValue(userValue)} meta={stat.userMeta} won={userWins} accent="var(--brand)" />
              <MetricSide label="Friend" value={formatValue(friendValue)} meta={stat.friendMeta} won={friendWins} accent="var(--gray-400)" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricSide({ label, value, meta, won, accent }: { label: string; value: string; meta: string | null; won: boolean; accent: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: won ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)', border: won ? '1px solid ' + accent : '1px solid var(--border-subtle)' }}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: won ? accent : 'var(--text-muted)' }}>{label}</span>
      <div className="mt-2 flex min-w-0 flex-col items-start gap-1 overflow-hidden">
        <span className="font-mono-data min-w-0 flex-1 whitespace-nowrap font-bold" style={{ color: won ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: value.length > 5 ? '0.8rem' : value.length > 4 ? '0.95rem' : '1.25rem' }}>{value}</span>
        {meta && <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{meta}</span>}
      </div>
    </div>
  );
}

