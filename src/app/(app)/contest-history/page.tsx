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
    <a
      href={contest.href}
      target="_blank"
      rel="noreferrer"
      className="grid grid-cols-[1fr_130px_130px] items-center gap-6 rounded-[24px] px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-[var(--bg-card-hover)]"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}
    >
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

function SolvedMarkers({ solved = 0, total = 5 }: { solved?: number; total?: number }) {
  const safeTotal = Math.max(1, total || 5);
  const safeSolved = Math.min(Math.max(0, solved || 0), safeTotal);

  return (
    <div className="hidden shrink-0 items-center gap-2 sm:flex" title={`${safeSolved}/${safeTotal} solved`}>
      <div className="flex gap-1">
        {Array.from({ length: safeTotal }).map((_, index) => (
          <div
            key={index}
            className="h-1.5 w-3 rounded-sm"
            style={{
              background: index < safeSolved ? '#4ade80' : 'var(--bg-elevated)',
              boxShadow: index < safeSolved ? '0 0 8px rgba(74,222,128,0.45)' : 'none',
            }}
          />
        ))}
      </div>
      <span className="font-mono-data text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{safeSolved}/{safeTotal}</span>
    </div>
  );
}

export default function ContestHistoryPage() {
  const { data, isLoading, error } = useContestsData();
  const { selectedPlatform } = useUIStore();
  const platformFilter = selectedPlatform;

  const history = (data?.history ?? []).filter((contest) => platformFilter === 'ALL' || contest.platform === platformFilter);
  const upcomingAll = (data?.upcoming ?? []).filter((contest) => platformFilter === 'ALL' || contest.platform === platformFilter);
  // Only show contests for which registration has started
  const upcoming = upcomingAll.filter((c) => c.registrationOpen === true);

  const totalContests = history.length;
  const rankedContests = history.filter((c) => typeof c.rank === 'number' && c.rank > 0);
  // Use client-computed avg when we have ranked contests; fall back to API-provided avg (only valid for ALL)
  const avgRank = rankedContests.length > 0
    ? Math.round(rankedContests.reduce((sum, c) => sum + (c.rank ?? 0), 0) / rankedContests.length)
    : platformFilter === 'ALL' ? (data?.stats?.avgRank ?? 0) : 0;

  function pickBestContest(list: ContestItem[]): ContestItem | null {
    if (!list.length) return null;
    const withRank = list.filter((c) => typeof c.rank === 'number' && (c.rank ?? 0) > 0);
    if (withRank.length > 0) {
      return withRank.reduce((best, c) => (c.rank! < best.rank! ? c : best));
    }
    return list.reduce((best, c) => (c.after - c.before > best.after - best.before ? c : best));
  }

  const bestContestCF = pickBestContest(history.filter((c) => c.platform === 'CODEFORCES'));
  const bestContestLC = pickBestContest(history.filter((c) => c.platform === 'LEETCODE'));
  const bestContest = pickBestContest(history);

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {error && (
        <p className="text-sm text-[var(--color-danger)]">Could not load contest data. Link your platforms and sync from Settings.</p>
      )}

      {/* Top 3 Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="18px" className="gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
              Total Contests
            </span>
            <Trophy size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="mt-1">
            <span className="font-mono-data text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              {isLoading ? '...' : totalContests}
            </span>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {platformFilter === 'ALL' ? 'Across all platforms' : platformFilter === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'}
            </p>
          </div>
        </Card>

        <Card padding="18px" className="gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
              Avg Rank
            </span>
            <TrendingUp size={18} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div className="mt-1">
            <span className="font-mono-data text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              {isLoading ? '...' : avgRank > 0 ? `#${avgRank.toLocaleString()}` : 'N/A'}
            </span>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {rankedContests.length > 0 ? `From ${rankedContests.length} ranked contests` : 'No ranked contests'}
            </p>
          </div>
        </Card>

        <Card padding="18px" className="gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
              Best Contest
            </span>
            <Trophy size={18} style={{ color: 'var(--accent-amber)' }} />
          </div>
          {isLoading ? (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : platformFilter === 'ALL' ? (
            // Show both CF and LC best when ALL is selected
            <div className="mt-1 flex flex-col gap-2">
              {[bestContestCF, bestContestLC].map((bc) => bc ? (
                <a
                  key={bc.id}
                  href={bc.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(79,142,247,0.04))',
                    border: '1px solid rgba(251,191,36,0.25)',
                    textDecoration: 'none',
                    boxShadow: '0 0 12px rgba(251,191,36,0.08)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PlatformLogo platform={bc.platform} size={14} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold" style={{ color: 'var(--text-primary)' }} title={bc.name}>
                        {bc.name}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(bc.date)}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1">
                      <span className="font-mono-data text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{bc.before}</span>
                      <ArrowUpRight size={12} style={{ color: 'var(--success)' }} />
                      <span className="font-mono-data text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{bc.after}</span>
                    </div>
                    {typeof bc.rank === 'number' && bc.rank > 0 && (
                      <p className="font-mono-data text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>#{bc.rank.toLocaleString()}</p>
                    )}
                  </div>
                </a>
              ) : null)}
              {!bestContestCF && !bestContestLC && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No contest data</p>
              )}
            </div>
          ) : bestContest ? (
            <a
              href={bestContest.href}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.10), rgba(79,142,247,0.04))',
                border: '1px solid rgba(251,191,36,0.30)',
                textDecoration: 'none',
                boxShadow: '0 0 16px rgba(251,191,36,0.10)',
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold" style={{ color: 'var(--text-primary)' }} title={bestContest.name}>
                  {bestContest.name}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(bestContest.date)}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="font-mono-data text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{bestContest.before}</span>
                  <ArrowUpRight size={13} style={{ color: 'var(--success)' }} />
                  <span className="font-mono-data text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{bestContest.after}</span>
                  <span className="rounded-md px-1.5 py-0.5 font-mono-data text-[10px] font-black" style={{ border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.1)', color: 'var(--success)' }}>
                    +{bestContest.after - bestContest.before}
                  </span>
                </div>
                {typeof bestContest.rank === 'number' && bestContest.rank > 0 && (
                  <p className="mt-0.5 font-mono-data text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    #{bestContest.rank.toLocaleString()}
                  </p>
                )}
              </div>
              <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </a>
          ) : (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>No contest data</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <Card padding="18px" className="gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
              Past {platformFilter === 'ALL' ? 'Platform' : platformFilter === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'} Contests
            </span>
            <CalendarClock size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin" size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2">
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

          <div className="max-h-[500px] min-h-[96px] overflow-y-auto pr-1">
            <div className="space-y-4">
              {upcoming.map((contest) => <UpcomingContestCard key={contest.id} contest={contest} />)}
              {!isLoading && upcoming.length === 0 && (
                <p className="py-5 text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming contests scheduled right now.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
