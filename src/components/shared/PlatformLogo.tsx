'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PlatformLogoProps {
  platform: 'CODEFORCES' | 'LEETCODE' | 'CODECHEF' | string;
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
  const isCodeforces = pUpper === 'CODEFORCES';
  const isLeetcode = pUpper === 'LEETCODE';
  const isCodechef = pUpper === 'CODECHEF';

  const logoUrl = LOGO_SRC[pUpper];

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
      {!failed && logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={platform}
          width={size}
          height={size}
          className={cn(
            'h-full w-full object-contain transition-all duration-200',
            isCodeforces && 'scale-90',
            !active && 'opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0'
          )}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="font-mono-data text-[10px] font-bold px-1 py-0.5 rounded"
          style={{
            color: isCodeforces ? '#ff6b6b' : isLeetcode ? 'var(--accent-amber)' : 'var(--accent-purple)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {isCodeforces ? 'CF' : isLeetcode ? 'LC' : isCodechef ? 'CC' : pUpper.slice(0, 2)}
        </span>
      )}
    </span>
  );
}
