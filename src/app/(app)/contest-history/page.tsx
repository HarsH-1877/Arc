'use client';

import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { ArrowDownRight, ArrowUpRight, CalendarClock, ExternalLink, Loader2, TrendingUp, Trophy } from 'lucide-react';
import { UpcomingContestCard } from '@/components/contest-history/UpcomingContestCard';
import { useContestsData, type ContestItem } from '@/hooks/useContestsData';
import { useUIStore } from '@/store/useUIStore';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function ContestRow({ contest, upcoming = false }: { contest: ContestItem; upcoming?: boolean }) {
  const delta = contest.after - contest.before;
  const positive = delta >= 0;

  return (
    <a href={contest.href} target="_blank" rel="noreferrer" className="grid grid-cols-[1fr_130px_130px] items-center gap-6 rounded-[24px] px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-[var(--bg-card-hover)]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}>
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex shrink-0 items-center justify-center rounded-full p-3.5" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-input)' }}>
          <PlatformLogo platform={contest.platform} size={20} />
        </div>
        <div className="min-w-0 overflow-x-auto no-scrollbar pb-1">
          <p className="flex flex-nowrap items-center gap-2 text-[17px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            <span className="whitespace-nowrap">{contest.name}</span>
            <ExternalLink size={12} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(contest.date)} at {contest.time}</p>
        </div>
      </div>
      <div className="hidden shrink-0 items-center justify-start sm:flex w-[130px]">
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
              background: index < solved ? '#4ade80' : 'var(--bg-elevated)',
              boxShadow: index < solved ? '0 0 8px rgba(74,222,128,0.45)' : 'none',
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
  const { data, isLoading, error } = useContestsData();
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  
  const history = (data?.history ?? []).filter((contest) => platformFilter === 'ALL' || contest.platform === platformFilter);
  const upcoming = (data?.upcoming ?? []).filter((contest) => platformFilter === 'ALL' || contest.platform === platformFilter);
  const bestByPlatform = (data?.bestByPlatform ?? []).filter((contest) => platformFilter === 'ALL' || contest.platform === platformFilter);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Contest History</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Recent rating movement and upcoming contest schedule.</p>
          {!isLoading && data?.stats && (
            <div className="mt-2 flex gap-4 text-sm">
              <div><span className="text-[var(--text-muted)]">Total Contests:</span> <span className="font-bold">{data.stats.totalContests}</span></div>
              <div><span className="text-[var(--text-muted)]">Avg Rank:</span> <span className="font-bold">{Math.round(data.stats.avgRank)}</span></div>
              <div><span className="text-[var(--text-muted)]">Best Gain:</span> <span className="font-bold">+{data.stats.bestGain}</span></div>
            </div>
          )}
        </div>
        <select 
          value={platformFilter} 
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-md border px-3 py-1.5 text-sm outline-none"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
        >
          <option value="ALL">All Platforms</option>
          <option value="CODEFORCES">Codeforces</option>
          <option value="LEETCODE">LeetCode</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-danger)]">Could not load contest data. Link your platforms and sync from Settings.</p>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <Card padding="18px" className="gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Last 10 {platformFilter === 'ALL' ? 'Platform' : platformFilter === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'} Contests</span>
            <CalendarClock size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin" size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto pr-2 space-y-2">
              {history.length > 0 ? (
                history.map((contest) => <ContestRow key={contest.id} contest={contest} />)
              ) : (
                <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No contest history yet. Link Codeforces or LeetCode to sync your results.</p>
              )}
            </div>
          )}
        </Card>

        <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden xl:h-auto xl:self-stretch">
          <div className="flex shrink-0 items-center justify-between px-1">
            <span className="rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.15em]" style={{ background: 'var(--text-primary)', color: 'var(--bg-card)' }}>
              UPCOMING CONTESTS
            </span>
            <TrendingUp size={18} style={{ color: 'var(--accent-purple)' }} />
          </div>

          <div className="max-h-[420px] min-h-[96px] overflow-y-auto pr-1">
            <div className="space-y-4">
              {upcoming.map((contest) => <UpcomingContestCard key={contest.id} contest={contest} />)}
              {!isLoading && upcoming.length === 0 && (
                <p className="py-5 text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming contests scheduled right now.</p>
              )}
            </div>
          </div>

          <Card padding="18px" className="shrink-0 gap-4 overflow-hidden mt-2">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.10), rgba(79,142,247,0.06))', pointerEvents: 'none' }} />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Best Contest</span>
              <Trophy size={20} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <div className="relative z-10 space-y-3">
              {bestByPlatform.length > 0 ? (
                bestByPlatform.map((contest) => <BestContestRow key={contest.platform} contest={contest} />)
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Best contest highlights appear after your first synced contests.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
