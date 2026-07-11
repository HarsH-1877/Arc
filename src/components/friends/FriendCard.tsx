'use client';

import type { Friend } from '@/hooks/useFriends';
import Link from 'next/link';
import { ArrowRight, UserMinus } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { PlatformLogo } from '@/components/shared/PlatformLogo';

interface FriendCardProps {
  friend: Friend;
  onUnfriend?: (friendshipId: string) => void;
  isUnfriending?: boolean;
}

const GRADIENTS = [
  'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
  'linear-gradient(135deg, var(--accent-purple), var(--accent-rose))',
  'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))',
  'linear-gradient(135deg, var(--accent-amber), var(--accent-rose))',
  'linear-gradient(135deg, var(--accent-rose), var(--accent-blue))',
];

function gradientForName(name: string) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

function PlatformBadge({ platform, value }: { platform: 'CODEFORCES' | 'LEETCODE'; value: number }) {
  const isCf = platform === 'CODEFORCES';
  return (
    <span className="font-mono-data inline-flex items-center gap-2" style={{ background: isCf ? 'rgba(255,70,70,0.12)' : 'rgba(251,191,36,0.12)', color: isCf ? '#ff6b6b' : 'var(--accent-amber)', border: isCf ? '1px solid rgba(255,70,70,0.2)' : '1px solid rgba(251,191,36,0.2)', borderRadius: '999px', padding: '3px 9px 3px 5px', fontSize: '12px', fontWeight: 700 }}>
      <PlatformLogo platform={platform} size={22} />
      {Math.round(value)}
    </span>
  );
}

export function FriendCard({ friend, onUnfriend, isUnfriending }: FriendCardProps) {
  const name = friend.displayName ?? friend.username;

  return (
    <div className="friend-card group grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-3 rounded-lg px-4 py-2.5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))', border: '1px solid var(--border-subtle)', transition: 'all 0.2s ease' }}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: gradientForName(name), color: '#fff', fontWeight: 700 }}>
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

      <Link href={'/compare?friend=' + friend.id} className="compare-btn hidden items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 md:flex" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
        Compare <ArrowRight size={14} />
      </Link>

      {onUnfriend && friend.friendshipId && (
        <button onClick={() => onUnfriend(friend.friendshipId!)} disabled={isUnfriending} className="flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-50" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }} title="Remove friend" aria-label="Remove friend">
          <UserMinus size={14} />
        </button>
      )}
    </div>
  );
}
