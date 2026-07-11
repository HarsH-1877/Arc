'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PlatformLogoProps {
  platform: 'CODEFORCES' | 'LEETCODE';
  size?: number;
  className?: string;
}

const LOGO_SRC = {
  CODEFORCES: '/cf-logo.webp',
  LEETCODE: '/lc-logo.png',
} as const;

export function PlatformLogo({ platform, size = 24, className }: PlatformLogoProps) {
  const [failed, setFailed] = useState(false);
  const isCodeforces = platform === 'CODEFORCES';

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden', className)}
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
          className="h-full w-full object-contain"
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
