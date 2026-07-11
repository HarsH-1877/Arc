'use client';

import { UserAvatar } from '@/components/shared/UserAvatar';
import { formatRelativeTime } from '@/lib/utils';
import type { CompareUser } from '@/hooks/useCompareData';
import { PlatformLogo } from '@/components/shared/PlatformLogo';

interface CompareHeaderProps {
  user: CompareUser;
  friend: CompareUser;
}

function ratingLabel(platform: 'CODEFORCES' | 'LEETCODE', value: number | null) {
  return (
    <span className="font-mono-data inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
      <PlatformLogo platform={platform} size={22} />
      {value != null ? Math.round(value).toLocaleString() : '-'}
    </span>
  );
}

export function CompareHeader({ user, friend }: CompareHeaderProps) {
  return (
    <div className="card card-glow grid grid-cols-1 items-stretch overflow-hidden md:grid-cols-[1fr_auto_1fr]">
      <IdentityBlock person={user} accent="var(--accent-blue)" align="left" />
      <div className="flex items-center justify-center px-4 py-3 md:py-0">
        <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          VS
        </span>
      </div>
      <IdentityBlock person={friend} accent="var(--accent-purple)" align="right" />
    </div>
  );
}

function IdentityBlock({ person, accent, align }: { person: CompareUser; accent: string; align: 'left' | 'right' }) {
  const right = align === 'right';
  return (
    <div className={'flex items-center gap-4 p-5 ' + (right ? 'flex-row-reverse text-right' : '')} style={{ background: right ? 'linear-gradient(225deg, rgba(167,139,250,0.06) 0%, transparent 100%)' : 'linear-gradient(135deg, rgba(79,142,247,0.06) 0%, transparent 100%)' }}>
      <div className="rounded-full p-[2px]" style={{ background: accent }}>
        <UserAvatar src={person.avatarUrl} name={person.displayName ?? person.username} size={52} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold" style={{ color: 'var(--text-primary)' }}>{person.displayName ?? person.username}</p>
        <p className="font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>@{person.username}</p>
        <div className={'mt-2 flex flex-wrap gap-2 ' + (right ? 'justify-end' : '')}>
          {ratingLabel('CODEFORCES', person.cfRating)}
          {ratingLabel('LEETCODE', person.lcRating)}
        </div>
        {person.lastSyncedAt && <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Last synced {formatRelativeTime(person.lastSyncedAt)}</p>}
      </div>
    </div>
  );
}
