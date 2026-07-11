'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  variant?: 'base' | 'raised';
  className?: string;
  padding?: string;
}

export function Card({ children, variant = 'base', className, padding = '20px 22px' }: CardProps) {
  const isRaised = variant === 'raised';

  return (
    <div
      className={cn('card card-glow relative flex flex-col', className)}
      style={{
        padding,
        borderColor: isRaised ? 'rgba(79,142,247,0.2)' : 'var(--border-subtle)',
        boxShadow: isRaised
          ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 40px rgba(0,0,0,0.28), 0 0 32px rgba(79,142,247,0.06)'
          : undefined,
      }}
    >
      {children}
    </div>
  );
}
