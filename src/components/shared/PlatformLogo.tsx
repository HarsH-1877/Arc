'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PlatformLogoProps {
  platform: 'CODEFORCES' | 'LEETCODE' | 'CODECHEF' | 'HACKERRANK' | string;
  size?: number;
  className?: string;
  active?: boolean;
}

const LOGO_SRC: Record<string, string> = {
  CODEFORCES: '/cf-logo.webp',
  LEETCODE: '/lc-logo.png',
  CODECHEF: '/codechef-logo.png',
};

export function PlatformLogo({ platform, size = 24, className, active = true }: PlatformLogoProps) {
  const [failed, setFailed] = useState(false);
  const pUpper = (platform || '').toUpperCase();
  const normalized =
    pUpper === 'CF' ? 'CODEFORCES' :
    pUpper === 'LC' ? 'LEETCODE' :
    pUpper === 'CC' ? 'CODECHEF' :
    pUpper === 'HR' ? 'HACKERRANK' :
    pUpper;

  const isCodeforces = normalized === 'CODEFORCES';
  const isLeetcode = normalized === 'LEETCODE';
  const isCodechef = normalized === 'CODECHEF';
  const isHackerrank = normalized === 'HACKERRANK';

  const logoUrl = LOGO_SRC[normalized];

  return (
    <span
      className={cn('group inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md', className)}
      style={{
        width: size,
        height: size,
        background: 'transparent',
        border: 'none',
      }}
    >
      {isHackerrank ? (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill={active ? '#2ec866' : 'currentColor'}
          className={cn('h-full w-full object-contain transition-all duration-200', !active && 'opacity-70')}
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 2.182c5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818-5.422 0-9.818-4.396-9.818-9.818 0-5.422 4.396-9.818 9.818-9.818M7.273 6.545v10.91h2.182V14.18h3.091v3.273h2.182V6.545h-2.182v3.273H9.455V6.545z"/>
        </svg>
      ) : !failed && logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={platform}
          width={size}
          height={size}
          className={cn(
            'h-full w-full object-contain transition-all duration-200',
            isCodeforces && 'scale-90',
            !active && 'opacity-70'
          )}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="font-mono-data text-[10px] font-bold px-1 py-0.5 rounded"
          style={{
            color: isCodeforces ? '#ff6b6b' : isLeetcode ? 'var(--accent-amber)' : isCodechef ? '#d97706' : isHackerrank ? '#2ec866' : 'var(--accent-purple)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {isCodeforces ? 'CF' : isLeetcode ? 'LC' : isCodechef ? 'CC' : isHackerrank ? 'HR' : normalized.slice(0, 2)}
        </span>
      )}
    </span>
  );
}
