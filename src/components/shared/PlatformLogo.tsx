'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PlatformLogoProps {
  platform: 'CODEFORCES' | 'LEETCODE';
  size?: number;
  className?: string;
  active?: boolean;
}

const LOGO_SRC = {
  CODEFORCES: '/cf-logo.webp',
  LEETCODE: '/lc-logo.png',
} as const;

export function PlatformLogo({ platform, size = 24, className, active = true }: PlatformLogoProps) {
  const [failed, setFailed] = useState(false);
  const isCodeforces = platform === 'CODEFORCES';

  return (
    <span
      className={cn('group inline-flex shrink-0 items-center justify-center overflow-hidden', className)}
      style={{
        width: size,
        height: size,
        background: 'transparent',
        border: 'none',
      }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={LOGO_SRC[platform]}
          alt=""
          width={size}
          height={size}
          className={cn('h-full w-full object-contain transition-all duration-200', !active && 'opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0')}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="font-mono-data text-[10px] font-bold"
          style={{ color: isCodeforces ? '#ff6b6b' : 'var(--accent-amber)' }}
        >
          {isCodeforces ? 'C' : 'L'}
        </span>
      )}
    </span>
  );
}
