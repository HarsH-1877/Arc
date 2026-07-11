'use client';

import type { CompareUser } from '@/hooks/useCompareData';

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
  const stats = [
    { label: 'Total Solved', userValue: user.totalSolved, friendValue: friend.totalSolved, unit: 'solved', lowerWins: false },
    { label: 'Longest Streak', userValue: longestStreak(user.heatmapData), friendValue: longestStreak(friend.heatmapData), unit: 'days', lowerWins: false },
    { label: 'Active Days', userValue: user.totalActiveDays, friendValue: friend.totalActiveDays, unit: 'days', lowerWins: false },
    { label: 'Avg Gap Days', userValue: averageGap(user.heatmapData), friendValue: averageGap(friend.heatmapData), unit: 'days', lowerWins: true },
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
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{stat.label}</span>
              {delta != null && <span className="font-mono-data rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>Delta {formatValue(delta)}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricSide label="You" value={formatValue(userValue)} unit={stat.unit} won={userWins} accent="var(--accent-blue)" />
              <MetricSide label="Friend" value={formatValue(friendValue)} unit={stat.unit} won={friendWins} accent="var(--accent-purple)" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricSide({ label, value, unit, won, accent }: { label: string; value: string; unit: string; won: boolean; accent: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: won ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)', border: won ? '1px solid ' + accent : '1px solid var(--border-subtle)' }}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: won ? accent : 'var(--text-muted)' }}>{label}</span>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono-data text-xl font-bold" style={{ color: won ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{value}</span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  );
}

