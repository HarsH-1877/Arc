'use client';

import { GlassCard } from '@/components/shared/GlassCard';
import { ArrowRight, Equal } from 'lucide-react';
import type { CompareUser } from '@/hooks/useCompareData';
import type { CompareVerdict, CompareWinner } from '@/types';

interface CompareVerdictStripProps {
  user: CompareUser;
  friend: CompareUser;
  verdict: CompareVerdict;
}

const CATEGORIES: Array<{
  key: keyof Pick<CompareVerdict, 'totalSolved' | 'consistency' | 'cfRating' | 'lcRating'>;
  label: string;
  userValue: (u: CompareUser) => string;
  friendValue: (f: CompareUser) => string;
}> = [
  {
    key: 'cfRating',
    label: 'Codeforces Rating',
    userValue: (u) => (u.cfRating != null ? String(u.cfRating) : '-'),
    friendValue: (f) => (f.cfRating != null ? String(f.cfRating) : '-'),
  },
  {
    key: 'lcRating',
    label: 'LeetCode Rating',
    userValue: (u) => (u.lcRating != null ? String(Math.round(u.lcRating)) : '-'),
    friendValue: (f) => (f.lcRating != null ? String(Math.round(f.lcRating)) : '-'),
  },
  {
    key: 'totalSolved',
    label: 'Total Solved',
    userValue: (u) => String(u.totalSolved),
    friendValue: (f) => String(f.totalSolved),
  },
  {
    key: 'consistency',
    label: 'Active Days',
    userValue: (u) => String(u.totalActiveDays),
    friendValue: (f) => String(f.totalActiveDays),
  },
];

function WinnerIndicator({ winner }: { winner: CompareWinner }) {
  if (winner === 'tie') {
    return <Equal size={14} style={{ color: 'var(--text-tertiary)' }} />;
  }
  return (
    <ArrowRight
      size={14}
      style={{ color: winner === 'user' ? 'var(--accent-primary)' : 'var(--accent-cyan)' }}
      className={winner === 'friend' ? 'rotate-180' : ''}
    />
  );
}

export function CompareVerdictStrip({ user, friend, verdict }: CompareVerdictStripProps) {
  return (
    <GlassCard padding="md">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const winner = verdict[cat.key];
          const winnerName =
            winner === 'user'
              ? user.username
              : winner === 'friend'
                ? friend.username
                : null;

          return (
            <div key={cat.key} className="text-center">
              <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {cat.label}
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <WinnerIndicator winner={winner} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {winner === 'tie' ? 'Tie' : `${winnerName} leads`}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                {cat.userValue(user)} / {cat.friendValue(friend)}
              </p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
