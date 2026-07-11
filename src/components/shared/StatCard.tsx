'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  loading?: boolean;
  variant?: 'base' | 'raised';
  deltaText?: string;
  children?: ReactNode;
  className?: string;
  padding?: string;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 800;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const current = Math.round(value * easeOutCubic(progress));
      setDisplay(current.toLocaleString());
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}</>;
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  loading = false,
  variant = 'base',
  deltaText,
  children,
  className,
  padding,
}: StatCardProps) {
  if (loading) {
    return (
      <Card variant={variant} className={cn('gap-3 overflow-hidden', className)} padding={padding}>
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-10 w-20" />
        <div className="skeleton h-5 w-28" />
      </Card>
    );
  }

  return (
    <Card variant={variant} className={cn('z-10 overflow-hidden', className)} padding={padding}>
      {children}
      <div className="relative z-10 flex h-full w-full flex-col items-start justify-between gap-3">
        <div className="flex w-full items-center justify-between">
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {label}
          </span>
          {icon && <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>}
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <span
            className="font-mono-data"
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          </span>
          {sub && <span className="min-w-0 truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{sub}</span>}
        </div>

        {deltaText && (
          <div
            className="font-mono-data inline-flex items-center justify-center"
            style={{
              background: 'rgba(52,211,153,0.12)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: '20px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {deltaText}
          </div>
        )}
      </div>
    </Card>
  );
}
