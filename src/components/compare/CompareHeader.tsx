'use client';

import { UserAvatar } from '@/components/shared/UserAvatar';
import { formatRelativeTime } from '@/lib/utils';
import type { CompareUser } from '@/hooks/useCompareData';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { cfRankName, cfRankColor } from '@/lib/codeforces/cf-rank';
import { ccRankColor, ccRankStars } from '@/lib/codechef/cc-rank';

interface CompareHeaderProps {
  user: CompareUser;
  friend: CompareUser;
}

function getLCRank(rating: number) {
  if (rating >= 2200) return 'Guardian';
  if (rating >= 1850) return 'Knight';
  return null;
}

function ratingLabel(
  platform: 'CODEFORCES' | 'LEETCODE' | 'CODECHEF',
  value: number | null,
  won: boolean,
  handle?: string | null,
) {
  const isCf = platform === 'CODEFORCES';
  const isCc = platform === 'CODECHEF';
  const rank = isCf
    ? (value ? cfRankName(value) : null)
    : isCc
    ? (value ? ccRankStars(value) : null)
    : (value ? getLCRank(value) : null);
  const rankColor = isCf && value ? cfRankColor(value) : isCc && value ? ccRankColor(value) : undefined;
  const accent = isCf ? 'var(--accent-cyan)' : isCc ? '#f59e0b' : 'var(--accent-amber)';
  const profileUrl = handle
    ? platform === 'CODEFORCES'
      ? `https://codeforces.com/profile/${handle}`
      : platform === 'CODECHEF'
      ? `https://www.codechef.com/users/${handle}`
      : `https://leetcode.com/u/${handle}`
    : null;

  const badge = (
    <span
      className="font-mono-data inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all hover:scale-105"
      style={{
        background: won ? (isCf ? 'rgba(34,211,238,0.1)' : isCc ? 'rgba(245,158,11,0.1)' : 'rgba(251,191,36,0.1)') : 'var(--bg-input)',
        border: won ? `1px solid ${accent}` : '1px solid var(--border-default)',
        color: won ? accent : 'var(--text-secondary)',
        cursor: profileUrl ? 'pointer' : 'default',
      }}
    >
      <PlatformLogo platform={platform} size={20} active={won} />
      {value != null ? Math.round(value).toLocaleString() : '-'}
      {rank && <span className="ml-0.5 font-sans tracking-wide" style={{ color: rankColor || 'inherit', opacity: rankColor ? 1 : 0.7 }}>({rank})</span>}
      {handle && <span className="font-sans text-[10px] opacity-60 ml-0.5 max-w-[80px] truncate">({handle})</span>}
    </span>
  );

  if (profileUrl) {
    return (
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`View ${handle}'s ${platform === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'} profile`}
        className="inline-block"
      >
        {badge}
      </a>
    );
  }

  return badge;
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
  const ccWon = person.ccRating != null && opponent.ccRating != null && person.ccRating > opponent.ccRating;

  return (
    <div className={'flex items-center gap-4 p-5 ' + (right ? 'flex-row-reverse text-right' : '')} style={{ background: 'transparent' }}>
      <div className="rounded-full p-[2px]" style={{ background: accent }}>
        <UserAvatar src={person.avatarUrl} name={person.username} size={52} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold font-mono-data" style={{ color: 'var(--text-primary)' }}>{person.username}</p>
        <div className={'mt-2 flex flex-wrap gap-2 ' + (right ? 'justify-end' : '')}>
          {person.cfHandle && ratingLabel('CODEFORCES', person.cfRating, cfWon, person.cfHandle)}
          {person.lcHandle && ratingLabel('LEETCODE', person.lcRating, lcWon, person.lcHandle)}
          {person.ccHandle && ratingLabel('CODECHEF', person.ccRating ?? null, ccWon, person.ccHandle)}
        </div>
      </div>
    </div>
  );
}
