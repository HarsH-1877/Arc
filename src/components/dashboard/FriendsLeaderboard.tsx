'use client';

import { Card } from '@/components/shared/Card';
import { useQuery } from '@tanstack/react-query';
import { getInitials } from '@/lib/utils';
import { ArrowUpRight, Crown } from 'lucide-react';
import { MOCK_FRIENDS, MOCK_PROFILE } from '@/lib/mock/data';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUIStore } from '@/store/useUIStore';
import Link from 'next/link';
import { cfRankName, cfRankColor } from '@/lib/codeforces/cf-rank';
import { ccRankStars, ccRankColor } from '@/lib/codechef/cc-rank';

interface FriendsLeaderboardProps {
  compact?: boolean;
}

function rankClass(rank: number) {
  if (rank === 1) return 'rank-badge rank-badge-1';
  if (rank === 2) return 'rank-badge rank-badge-2';
  if (rank === 3) return 'rank-badge rank-badge-3';
  return 'rank-badge rank-badge-default';
}

export function getRankAbbr(platform: 'ALL' | 'CODEFORCES' | 'LEETCODE' | 'CODECHEF', rating: number) {
  if (platform === 'CODEFORCES') {
    return cfRankName(rating);
  } else if (platform === 'CODECHEF') {
    return ccRankStars(rating);
  } else {
    if (rating >= 2200) return 'G';
    if (rating >= 1850) return 'K';
    return '';
  }
}

export function getRankColor(platform: 'ALL' | 'CODEFORCES' | 'LEETCODE' | 'CODECHEF', rating: number) {
  if (platform === 'CODEFORCES') {
    return cfRankColor(rating);
  }
  if (platform === 'CODECHEF') {
    return ccRankColor(rating);
  }
  if (rating >= 2200) return '#ef4444';
  if (rating >= 1850) return '#3b82f6';
  return undefined;
}

export function FriendsLeaderboard({ compact = false }: FriendsLeaderboardProps) {
  const { data: dashboardData } = useDashboardData();
  const { selectedPlatform } = useUIStore();

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await fetch('/api/friends');
      if (!res.ok) return MOCK_FRIENDS;
      return res.json();
    },
  });

  const userRating = selectedPlatform === 'CODEFORCES'
    ? dashboardData?.platforms?.codeforces?.currentRating ?? 0
    : selectedPlatform === 'CODECHEF'
    ? dashboardData?.platforms?.codechef?.currentRating ?? 0
    : dashboardData?.platforms?.leetcode?.contestRating ?? 0;

  const sortedLeaderboard = [
    ...friends.map((f: any) => ({
      id: f.id,
      name: f.username,
      rating: selectedPlatform === 'CODEFORCES'
        ? (f.cfRating ?? 0)
        : selectedPlatform === 'CODECHEF'
        ? (f.ccRating ?? 0)
        : (f.lcRating ?? 0),
      isYou: false,
    })),
    {
      id: dashboardData?.user.id ?? 'you',
      name: dashboardData?.user.username ?? MOCK_PROFILE.username,
      rating: userRating,
      isYou: true,
    },
  ].sort((a, b) => b.rating - a.rating).map((entry, index) => ({ ...entry, rank: index + 1 }));

  const userEntry = sortedLeaderboard.find((entry) => entry.isYou);
  const leaderboard = sortedLeaderboard;

  const renderRow = (user: any) => {
    const rank = user.rank;
    return (
      <div
        key={user.id}
        className={`group flex items-center gap-3 rounded-xl px-2.5 py-2.5 ${user.isYou ? 'sticky bottom-0 z-10' : ''}`}
        style={{
          background: user.isYou ? 'var(--brand-dim)' : 'var(--bg-elevated)',
          border: user.isYou ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
          borderLeft: user.isYou ? '3px solid var(--brand)' : undefined,
          backdropFilter: user.isYou ? 'blur(8px)' : undefined,
        }}
      >
        <span className={rankClass(rank)}>{rank}</span>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: user.isYou ? 'var(--brand)' : 'var(--bg-input)', color: user.isYou ? '#fff' : 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>
          {getInitials(user.name)}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm" style={{ color: user.isYou ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: user.isYou ? 700 : 500 }}>
          {user.name}
        </span>
        <span className={`font-mono-data flex items-center gap-1 rounded-full px-2 py-1 text-xs ${user.isYou ? '' : 'group-hover:hidden'}`} style={{ color: user.isYou ? 'var(--brand)' : 'var(--text-secondary)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
          {getRankAbbr(selectedPlatform, user.rating) && (
            <span className="mr-1 text-[10px] font-bold" style={{ color: getRankColor(selectedPlatform, user.rating) || 'inherit', opacity: getRankColor(selectedPlatform, user.rating) ? 1 : 0.6 }}>{getRankAbbr(selectedPlatform, user.rating)}</span>
          )}
          <ArrowUpRight size={12} style={{ color: 'var(--text-muted)' }} />
          {user.rating.toLocaleString()}
        </span>
        {!user.isYou && (
          <Link href={`/compare?friend=${user.id}`} className="hidden group-hover:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand)', color: 'var(--text-primary)', textDecoration: 'none' }}>
            Compare <ArrowUpRight size={12} />
          </Link>
        )}
      </div>
    );
  };

  return (
    <Card variant="base" padding={compact ? '16px' : '20px 22px'} className="h-full overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Friends Leaderboard
        </span>
        <span className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold" style={{ color: 'var(--accent-amber)', background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.16)' }}>
          <Crown size={11} />
          Top ratings
        </span>
      </div>

      <div className="min-h-0 overflow-y-auto pr-1" style={{ maxHeight: compact ? '250px' : '300px' }}>
        <div className="flex min-h-0 flex-col gap-2 relative">
          {leaderboard.map((user) => renderRow(user))}
        </div>
      </div>
    </Card>
  );
}
