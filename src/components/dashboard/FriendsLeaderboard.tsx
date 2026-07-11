'use client';

import { Card } from '@/components/shared/Card';
import { useQuery } from '@tanstack/react-query';
import { getInitials } from '@/lib/utils';
import { ArrowUpRight, Crown } from 'lucide-react';
import { MOCK_FRIENDS, MOCK_PROFILE } from '@/lib/mock/data';
import { useDashboardData } from '@/hooks/useDashboardData';

interface FriendsLeaderboardProps {
  compact?: boolean;
}

function rankClass(rank: number) {
  if (rank === 1) return 'rank-badge rank-badge-1';
  if (rank === 2) return 'rank-badge rank-badge-2';
  if (rank === 3) return 'rank-badge rank-badge-3';
  return 'rank-badge rank-badge-default';
}

export function FriendsLeaderboard({ compact = false }: FriendsLeaderboardProps) {
  const { data: dashboardData } = useDashboardData();

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await fetch('/api/friends');
      if (!res.ok) return MOCK_FRIENDS;
      return res.json();
    },
  });

  const userRating = dashboardData?.platforms?.codeforces?.currentRating ?? 0;
  const sortedLeaderboard = [
    ...friends.map((f: any) => ({
      id: f.id,
      name: f.displayName ?? f.username,
      rating: f.cfRating ?? 0,
      isYou: false,
    })),
    {
      id: 'you',
      name: MOCK_PROFILE.displayName ?? MOCK_PROFILE.username,
      rating: userRating,
      isYou: true,
    },
  ].sort((a, b) => b.rating - a.rating).map((entry, index) => ({ ...entry, rank: index + 1 }));

  const userEntry = sortedLeaderboard.find((entry) => entry.isYou);
  const leaderboard = userEntry && userEntry.rank > 5
    ? [...sortedLeaderboard.slice(0, 4), userEntry, ...sortedLeaderboard.slice(4).filter((entry) => !entry.isYou)]
    : sortedLeaderboard;

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
        <div className="flex min-h-0 flex-col gap-2">
        {leaderboard.map((user) => {
          const rank = user.rank;
          return (
            <div
              key={user.id}
              className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5"
              style={{
                background: user.isYou
                  ? 'linear-gradient(135deg, rgba(79,142,247,0.18), rgba(167,139,250,0.08))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))',
                border: user.isYou ? '1px solid rgba(79,142,247,0.28)' : '1px solid var(--border-subtle)',
                boxShadow: user.isYou ? '0 0 24px rgba(79,142,247,0.08)' : 'none',
              }}
            >
              <span className={rankClass(rank)}>{rank}</span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: user.isYou ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'var(--bg-input)', color: user.isYou ? '#fff' : 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>
                {getInitials(user.name)}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm" style={{ color: user.isYou ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: user.isYou ? 700 : 500 }}>
                {user.name}
              </span>
              <span className="font-mono-data flex items-center gap-1 rounded-full px-2 py-1 text-xs" style={{ color: user.isYou ? 'var(--accent-blue)' : 'var(--text-secondary)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <ArrowUpRight size={12} style={{ color: 'var(--text-muted)' }} />
                {user.rating.toLocaleString()}
              </span>
            </div>
          );
        })}
        </div>
      </div>
    </Card>
  );
}
