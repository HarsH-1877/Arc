'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface StreakBannerProps {
  currentStreak: number;
  longestStreak: number;
  freezeTokens: number;
  totalActiveDays: number;
  loading?: boolean;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 800, 1);
      setDisplay(Math.round(value * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}</>;
}

export function StreakBanner({ currentStreak, longestStreak, freezeTokens, totalActiveDays, loading }: StreakBannerProps) {
  if (loading) {
    return <div className="skeleton h-24 w-full" />;
  }

  return (
    <section className="card card-glow relative mb-6 flex w-full items-center justify-between overflow-hidden px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(167,139,250,0.06) 100%)', border: '1px solid rgba(79,142,247,0.12)' }}>
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--accent-amber)' }}>
          <Zap size={22} fill="currentColor" className="streak-bolt" />
        </div>
        <div className="flex items-end gap-3">
          <span className="font-mono-data leading-none" style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '-0.03em' }}>
            <CountUp value={currentStreak} />
          </span>
          <div className="pb-1">
            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>day streak</p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
              Longest: {longestStreak} days &middot; {totalActiveDays} active days
            </p>
          </div>
        </div>
      </div>

      <span className="absolute right-5 top-4" style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--accent-amber)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '20px', padding: '3px 9px', fontSize: '11px', fontWeight: 700 }}>
        {freezeTokens} freezes remaining
      </span>
    </section>
  );
}
