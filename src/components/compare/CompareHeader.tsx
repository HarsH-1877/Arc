'use client';

import { UserAvatar } from '@/components/shared/UserAvatar';
import { formatRelativeTime } from '@/lib/utils';
import type { CompareUser } from '@/hooks/useCompareData';
import { PlatformLogo } from '@/components/shared/PlatformLogo';

interface CompareHeaderProps {
  user: CompareUser;
  friend: CompareUser;
}

function getCFRank(rating: number) {
  if (rating >= 3000) return 'LGM';
  if (rating >= 2600) return 'IGM';
  if (rating >= 2400) return 'GM';
  if (rating >= 2100) return 'Master';
  if (rating >= 1900) return 'CM';
  if (rating >= 1600) return 'Expert';
  if (rating >= 1400) return 'Specialist';
  if (rating >= 1200) return 'Pupil';
  return 'Newbie';
}

function getLCRank(rating: number) {
  if (rating >= 2200) return 'Guardian';
  if (rating >= 1850) return 'Knight';
  return null;
}

function ratingLabel(platform: 'CODEFORCES' | 'LEETCODE', value: number | null, won: boolean) {
  const rank = platform === 'CODEFORCES' ? (value ? getCFRank(value) : null) : (value ? getLCRank(value) : null);
  const isCf = platform === 'CODEFORCES';
  const accent = isCf ? 'var(--accent-cyan)' : 'var(--accent-amber)';
  
  return (
    <span className="font-mono-data inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors" style={{ background: won ? (isCf ? 'rgba(34,211,238,0.1)' : 'rgba(251,191,36,0.1)') : 'var(--bg-input)', border: won ? `1px solid ${accent}` : '1px solid var(--border-default)', color: won ? accent : 'var(--text-secondary)' }}>
      <PlatformLogo platform={platform} size={20} active={won} />
      {value != null ? Math.round(value).toLocaleString() : '-'}
      {rank && <span className="ml-0.5 font-sans tracking-wide opacity-70">({rank})</span>}
    </span>
  );
}

export function CompareHeader({ user, friend }: CompareHeaderProps) {
  return (
    <div className="card card-glow grid grid-cols-1 items-stretch overflow-hidden md:grid-cols-[1fr_auto_1fr]">
      <IdentityBlock person={user} opponent={friend} accent="var(--brand)" align="left" />
      <div className="flex items-center justify-center px-4 py-3 md:py-0">
        <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          VS
        </span>
      </div>
      <IdentityBlock person={friend} opponent={user} accent="var(--gray-400)" align="right" />
    </div>
  );
}

function IdentityBlock({ person, opponent, accent, align }: { person: CompareUser; opponent: CompareUser; accent: string; align: 'left' | 'right' }) {
  const right = align === 'right';
  const cfWon = person.cfRating != null && opponent.cfRating != null && person.cfRating > opponent.cfRating;
  const lcWon = person.lcRating != null && opponent.lcRating != null && person.lcRating > opponent.lcRating;

  return (
    <div className={'flex items-center gap-4 p-5 ' + (right ? 'flex-row-reverse text-right' : '')} style={{ background: 'transparent' }}>
      <div className="rounded-full p-[2px]" style={{ background: accent }}>
        <UserAvatar src={person.avatarUrl} name={person.displayName ?? person.username} size={52} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold" style={{ color: 'var(--text-primary)' }}>{person.displayName ?? person.username}</p>
        <p className="font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>@{person.username}</p>
        <div className={'mt-2 flex flex-wrap gap-2 ' + (right ? 'justify-end' : '')}>
          {ratingLabel('CODEFORCES', person.cfRating, cfWon)}
          {ratingLabel('LEETCODE', person.lcRating, lcWon)}
        </div>
      </div>
    </div>
  );
}
