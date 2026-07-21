'use client';

import { Card } from '@/components/shared/Card';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { ArrowDownRight, ArrowUpRight, CalendarClock, ExternalLink, TrendingUp, Trophy } from 'lucide-react';
import { UpcomingContestCard } from '@/components/contest-history/UpcomingContestCard';

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
  { id: 'u1', name: 'Codeforces Round 1040 (Div. 2)', platform: 'CODEFORCES', date: '2026-07-12', time: '20:05', before: 1823, after: 1823, solved: 0, total: 7, href: 'https://codeforces.com/contests' },
  { id: 'u2', name: 'LeetCode Weekly Contest 459', platform: 'LEETCODE', date: '2026-07-14', time: '08:00', before: 1848, after: 1848, solved: 0, total: 4, href: 'https://leetcode.com/contest/' },
  { id: 'u3', name: 'Educational Codeforces Round 181', platform: 'CODEFORCES', date: '2026-07-18', time: '19:35', before: 1823, after: 1823, solved: 0, total: 8, href: 'https://codeforces.com/contests' },
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
    <a href={contest.href} target="_blank" rel="noreferrer" className="grid grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)] items-center gap-6 rounded-[24px] px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-[var(--bg-card-hover)]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}>
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex shrink-0 items-center justify-center rounded-full p-3.5 mt-1" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-input)' }}>
          <PlatformLogo platform={contest.platform} size={20} />
        </div>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[18px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            <span>{contest.name}</span>
            <ExternalLink size={12} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(contest.date)} at {contest.time}</p>
        </div>
      </div>
      <div className="hidden shrink-0 items-center justify-start sm:flex w-[150px]">
        {!upcoming && <SolvedMarkers solved={contest.solved} total={contest.total} />}
      </div>
      <div className="shrink-0 text-right">
        {upcoming ? (
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: 'var(--accent-amber)', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}>Upcoming</span>
        ) : (
          <>
            <div className="flex items-center justify-end gap-2">
              <span className="font-mono-data text-xs font-black" style={{ color: 'var(--text-muted)' }}>{contest.before}</span>
              {positive ? <ArrowUpRight size={16} style={{ color: 'var(--success)' }} /> : <ArrowDownRight size={16} style={{ color: 'var(--danger)' }} />}
              <span className="font-mono-data text-xs font-black" style={{ color: 'var(--text-primary)' }}>{contest.after}</span>
            </div>
            <div className="mt-2 flex justify-end">
              <span className="rounded-md px-2.5 py-1 font-mono-data text-[12px] font-black leading-none" style={{ border: positive ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(244,63,94,0.3)', background: positive ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)', color: positive ? 'var(--success)' : 'var(--danger)' }}>
                {positive ? '+' : ''}{delta}
              </span>
            </div>
          </>
        )}
      </div>
    </a>
  );
}

function SolvedMarkers({ solved, total }: { solved: number; total: number }) {
  return (
    <div className="hidden shrink-0 items-center gap-2 sm:flex" title={`${solved}/${total} solved`}>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className="h-1.5 w-3 rounded-sm"
            style={{ 
              background: index < solved ? 'var(--success)' : 'var(--bg-elevated)',
              boxShadow: index < solved ? '0 0 8px rgba(52,211,153,0.4)' : 'none'
            }}
          />
        ))}
      </div>
      <span className="font-mono-data text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{solved}/{total}</span>
    </div>
  );
}

function BestContestRow({ contest }: { contest: ContestItem }) {
  const delta = contest.after - contest.before;
  const positive = delta >= 0;
  return (
    <a href={contest.href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-[24px] p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-[var(--bg-card-hover)]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex shrink-0 items-center justify-center rounded-full p-3.5" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-input)' }}>
            <PlatformLogo platform={contest.platform} size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[20px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{contest.name}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(contest.date)} at {contest.time}</p>
            <div className="mt-3">
              <SolvedMarkers solved={contest.solved} total={contest.total} />
            </div>
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="flex justify-end">
          <span className="rounded-md px-3 py-1.5 font-mono-data text-[18px] font-black leading-none" style={{ border: positive ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(244,63,94,0.3)', background: positive ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)', color: positive ? 'var(--success)' : 'var(--danger)' }}>
            {positive ? '+' : ''}{delta}
          </span>
        </div>
        <p className="mt-2 font-mono-data text-xs font-black" style={{ color: 'var(--text-secondary)' }}>{contest.before} to {contest.after}</p>
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <Card padding="18px" className="gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Last 10 Contests</span>
            <CalendarClock size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="space-y-2">
            {HISTORY.map((contest) => <ContestRow key={contest.id} contest={contest} />)}
          </div>
        </Card>

        <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden xl:h-auto xl:self-stretch">
          <div className="flex shrink-0 items-center justify-between px-1">
            <span className="rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.15em]" style={{ background: 'var(--text-primary)', color: 'var(--bg-card)' }}>
              UPCOMING CONTESTS
            </span>
            <TrendingUp size={18} style={{ color: 'var(--accent-purple)' }} />
          </div>
          
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0 overflow-y-auto no-scrollbar pb-4 pr-1">
              <div className="space-y-4">
                {UPCOMING.map((contest) => <UpcomingContestCard key={contest.id} contest={contest} />)}
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-base)] to-transparent" />
          </div>

          <Card padding="18px" className="shrink-0 gap-4 overflow-hidden mt-2">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.10), rgba(79,142,247,0.06))', pointerEvents: 'none' }} />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Best Contest</span>
              <Trophy size={20} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <div className="relative z-10 space-y-3">
              {BEST_BY_PLATFORM.map((contest) => <BestContestRow key={contest.platform} contest={contest} />)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
