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
  
  const platformColor = isCf ? '#3b82f6' : isCc ? '#2dd4bf' : '#f59e0b';
  const accent = rankColor || platformColor;
  
  const profileUrl = handle
    ? platform === 'CODEFORCES'
      ? `https://codeforces.com/profile/${handle}`
      : platform === 'CODECHEF'
      ? `https://www.codechef.com/users/${handle}`
      : `https://leetcode.com/u/${handle}`
    : null;

  const badge = (
    <span
      className="inline-flex items-center gap-2.5 rounded-full pl-2.5 pr-3.5 py-1.5 transition-all hover:scale-105"
      style={{
        background: won ? `${accent}15` : 'transparent',
        border: `1px solid ${won ? accent : `${accent}50`}`,
        cursor: profileUrl ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-center gap-1.5">
        <PlatformLogo platform={platform} size={16} active={true} />
        <span className="font-mono-data text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
          {value != null ? Math.round(value).toLocaleString() : '-'}
        </span>
      </div>
      
      <div className="h-6 w-[1px]" style={{ background: `${accent}40` }} />
      
      <div className="flex flex-col justify-center text-left">
        <span className="font-sans text-[10px] font-bold leading-[1.2]" style={{ color: accent }}>
          {rank || (isCf ? 'Codeforces' : isCc ? 'CodeChef' : 'LeetCode')}
        </span>
        {handle && (
          <span className="font-sans text-[9px] leading-[1.2] opacity-60 max-w-[80px] truncate" style={{ color: 'var(--text-primary)' }}>
            {handle}
          </span>
        )}
      </div>
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
