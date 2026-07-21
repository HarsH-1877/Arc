'use client';

import type { Friend } from '@/hooks/useFriends';
import Link from 'next/link';
import { BarChart2, UserMinus } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { PlatformLogo } from '@/components/shared/PlatformLogo';

interface FriendCardProps {
  friend: Friend;
  onUnfriend?: (friendshipId: string) => void;
  isUnfriending?: boolean;
  rank?: number;
}

const GRADIENTS = [
  'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
  'linear-gradient(135deg, var(--accent-purple), var(--accent-rose))',
  'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
  'linear-gradient(135deg, var(--accent-amber), var(--accent-rose))',
  'linear-gradient(135deg, var(--accent-rose), var(--accent-blue))',
];

function colorForName(name: string) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'rgba(79, 142, 247, 0.15)', // blue
    'rgba(167, 139, 250, 0.15)', // purple
    'rgba(52, 211, 153, 0.15)', // green
    'rgba(251, 191, 36, 0.15)', // amber
    'rgba(251, 113, 133, 0.15)', // rose
    'rgba(148, 163, 184, 0.15)', // slate
  ];
  return colors[hash % colors.length];
}

function PlatformBadge({ platform, value }: { platform: 'CODEFORCES' | 'LEETCODE'; value: number }) {
  return (
    <span className="font-mono-data inline-flex w-[76px] items-center gap-2" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '999px', padding: '3px 9px 3px 5px', fontSize: '12px', fontWeight: 700 }}>
      <PlatformLogo platform={platform} size={22} />
      {Math.round(value)}
    </span>
  );
}

export function FriendCard({ friend, onUnfriend, isUnfriending, rank }: FriendCardProps) {
  const name = friend.displayName ?? friend.username;

  return (
    <div className="friend-card group grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-4 rounded-xl px-4 py-3 hover:-translate-y-0.5 hover:border-[var(--border-strong)]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))', border: '1px solid var(--border-subtle)', transition: 'all 0.2s ease' }}>
      
      {rank !== undefined && (
        <div className="flex w-[24px] shrink-0 items-center justify-center">
          <span 
            className="font-mono-data flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
            style={
              rank === 1 ? { background: 'rgba(251,191,36,0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(251,191,36,0.3)' } :
              rank === 2 ? { background: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' } :
              rank === 3 ? { background: 'rgba(217,119,6,0.15)', color: '#d97706', border: '1px solid rgba(217,119,6,0.3)' } :
              { color: 'var(--text-muted)' }
            }
          >
            {rank}
          </span>
        </div>
      )}

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: colorForName(name), color: 'var(--text-primary)', fontWeight: 700, border: '1px solid rgba(255,255,255,0.05)' }}>
        {getInitials(name)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
        <p className="truncate text-xs font-mono-data" style={{ color: 'var(--text-muted)' }}>@{friend.username}</p>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        {friend.cfRating != null && <PlatformBadge platform="CODEFORCES" value={friend.cfRating} />}
        {friend.lcRating != null && <PlatformBadge platform="LEETCODE" value={friend.lcRating} />}
      </div>

      <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Link href={'/compare?friend=' + friend.id} className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', textDecoration: 'none' }} title="Compare">
          <BarChart2 size={14} />
        </Link>

        {onUnfriend && friend.friendshipId && (
          <button onClick={() => onUnfriend(friend.friendshipId!)} disabled={isUnfriending} className="flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-50 transition-colors hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }} title="Remove friend" aria-label="Remove friend">
            <UserMinus size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
