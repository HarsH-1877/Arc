'use client';

import { Card } from '@/components/shared/Card';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { ArrowDownRight, ArrowUpRight, CalendarClock, ExternalLink, TrendingUp, Trophy } from 'lucide-react';

type Platform = 'CODEFORCES' | 'LEETCODE';

interface ContestItem {
  id: string;
  name: string;
  platform: Platform;
  date: string;
  time: string;
  before: number;
  after: number;
  solved: number;
  total: number;
  href: string;
}

const HISTORY: ContestItem[] = [
  { id: 'c1', name: 'Codeforces Round 1034', platform: 'CODEFORCES', date: '2026-06-29', time: '20:05', before: 1788, after: 1823, solved: 5, total: 7, href: 'https://codeforces.com/contests' },
  { id: 'c2', name: 'LeetCode Weekly Contest 456', platform: 'LEETCODE', date: '2026-06-22', time: '08:00', before: 1819, after: 1848, solved: 3, total: 4, href: 'https://leetcode.com/contest/' },
  { id: 'c3', name: 'Codeforces Round 1031', platform: 'CODEFORCES', date: '2026-06-15', time: '19:35', before: 1812, after: 1788, solved: 3, total: 7, href: 'https://codeforces.com/contests' },
  { id: 'c4', name: 'LeetCode Biweekly Contest 161', platform: 'LEETCODE', date: '2026-06-08', time: '20:00', before: 1792, after: 1819, solved: 3, total: 4, href: 'https://leetcode.com/contest/' },
  { id: 'c5', name: 'Codeforces Educational Round 179', platform: 'CODEFORCES', date: '2026-06-01', time: '20:05', before: 1760, after: 1812, solved: 6, total: 8, href: 'https://codeforces.com/contests' },
  { id: 'c6', name: 'LeetCode Weekly Contest 453', platform: 'LEETCODE', date: '2026-05-25', time: '08:00', before: 1808, after: 1792, solved: 2, total: 4, href: 'https://leetcode.com/contest/' },
  { id: 'c7', name: 'Codeforces Round 1024', platform: 'CODEFORCES', date: '2026-05-18', time: '19:35', before: 1734, after: 1760, solved: 4, total: 7, href: 'https://codeforces.com/contests' },
  { id: 'c8', name: 'LeetCode Biweekly Contest 158', platform: 'LEETCODE', date: '2026-05-11', time: '20:00', before: 1771, after: 1808, solved: 4, total: 4, href: 'https://leetcode.com/contest/' },
  { id: 'c9', name: 'Codeforces Round 1019', platform: 'CODEFORCES', date: '2026-05-04', time: '20:05', before: 1758, after: 1734, solved: 2, total: 6, href: 'https://codeforces.com/contests' },
  { id: 'c10', name: 'LeetCode Weekly Contest 450', platform: 'LEETCODE', date: '2026-04-27', time: '08:00', before: 1739, after: 1771, solved: 3, total: 4, href: 'https://leetcode.com/contest/' },
];

const UPCOMING: ContestItem[] = [
  { id: 'u1', name: 'Codeforces Round 1040', platform: 'CODEFORCES', date: '2026-07-12', time: '20:05', before: 1823, after: 1823, solved: 0, total: 7, href: 'https://codeforces.com/contests' },
  { id: 'u2', name: 'LeetCode Weekly Contest 459', platform: 'LEETCODE', date: '2026-07-14', time: '08:00', before: 1848, after: 1848, solved: 0, total: 4, href: 'https://leetcode.com/contest/' },
  { id: 'u3', name: 'Codeforces Educational Round 181', platform: 'CODEFORCES', date: '2026-07-18', time: '19:35', before: 1823, after: 1823, solved: 0, total: 8, href: 'https://codeforces.com/contests' },
];

const BEST_BY_PLATFORM = (['CODEFORCES', 'LEETCODE'] as const).map((platform) => (
  HISTORY.filter((contest) => contest.platform === platform).reduce((best, contest) => (contest.after - contest.before > best.after - best.before ? contest : best))
));

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function ContestRow({ contest, upcoming = false }: { contest: ContestItem; upcoming?: boolean }) {
  const delta = contest.after - contest.before;
  const positive = delta >= 0;

  return (
    <a href={contest.href} target="_blank" rel="noreferrer" className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.036), rgba(255,255,255,0.012))', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}>
      <div className="flex min-w-0 items-center gap-3">
        <PlatformLogo platform={contest.platform} size={28} />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <p className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              <span className="truncate">{contest.name}</span>
              <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
            </p>
            {!upcoming && <SolvedMarkers solved={contest.solved} total={contest.total} />}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(contest.date)} at {contest.time}</p>
        </div>
      </div>
      <div className="text-right">
        {upcoming ? (
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: 'var(--accent-amber)', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>Upcoming</span>
        ) : (
          <>
            <div className="flex items-center justify-end gap-2">
              <span className="font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>{contest.before}</span>
              {positive ? <ArrowUpRight size={16} style={{ color: 'var(--success)' }} /> : <ArrowDownRight size={16} style={{ color: 'var(--text-muted)' }} />}
              <span className="font-mono-data text-xs" style={{ color: 'var(--text-primary)' }}>{contest.after}</span>
            </div>
            <p className="mt-1 font-mono-data text-sm font-bold" style={{ color: positive ? 'var(--success)' : 'var(--text-muted)' }}>{positive ? '+' : ''}{delta}</p>
          </>
        )}
      </div>
    </a>
  );
}

function SolvedMarkers({ solved, total }: { solved: number; total: number }) {
  return (
    <div className="hidden shrink-0 items-center gap-2 sm:flex" title={`${solved}/${total} solved`}>
      <div className="flex gap-[2px]">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className="h-1.5 w-3 rounded-[1px]"
            style={{ background: index < solved ? 'var(--success)' : 'var(--bg-elevated)' }}
          />
        ))}
      </div>
      <span className="font-mono-data text-[10px]" style={{ color: 'var(--text-muted)' }}>{solved}/{total}</span>
    </div>
  );
}

function BestContestRow({ contest }: { contest: ContestItem }) {
  const delta = contest.after - contest.before;
  const positive = delta >= 0;
  return (
    <a href={contest.href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', textDecoration: 'none' }}>
      <div className="flex min-w-0 items-center gap-3">
        <PlatformLogo platform={contest.platform} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{contest.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(contest.date)} at {contest.time}</p>
          <div className="mt-2">
            <SolvedMarkers solved={contest.solved} total={contest.total} />
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono-data text-2xl font-bold" style={{ color: positive ? 'var(--success)' : 'var(--text-muted)' }}>{positive ? '+' : ''}{delta}</p>
        <p className="font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>{contest.before} to {contest.after}</p>
      </div>
    </a>
  );
}

export default function ContestHistoryPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Contest History</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Recent rating movement and upcoming contest schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card padding="18px" className="gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Last 10 Contests</span>
            <CalendarClock size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="space-y-2">
            {HISTORY.map((contest) => <ContestRow key={contest.id} contest={contest} />)}
          </div>
        </Card>

        <div className="space-y-4">
          <Card padding="18px" className="gap-4 overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.10), rgba(79,142,247,0.06))', pointerEvents: 'none' }} />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Best Contest</span>
              <Trophy size={20} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <div className="relative z-10 max-h-[230px] space-y-3 overflow-y-auto pr-1">
              {BEST_BY_PLATFORM.map((contest) => <BestContestRow key={contest.platform} contest={contest} />)}
            </div>
          </Card>

          <Card padding="18px" className="gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Upcoming Contests</span>
              <TrendingUp size={18} style={{ color: 'var(--accent-purple)' }} />
            </div>
            <div className="space-y-2">
              {UPCOMING.map((contest) => <ContestRow key={contest.id} contest={contest} upcoming />)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
