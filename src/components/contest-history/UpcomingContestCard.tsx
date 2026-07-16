'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

interface ContestItem {
  id: string;
  name: string;
  platform: 'CODEFORCES' | 'LEETCODE';
  date: string;
  time: string;
  href: string;
}

function parseDuration(platform: 'CODEFORCES' | 'LEETCODE') {
  return platform === 'CODEFORCES' ? '2H' : '1H 30M';
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function UpcomingContestCard({ contest }: { contest: ContestItem }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(`${contest.date}T${contest.time}:00`).getTime();
    
    const tick = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return false;
      }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
      return true;
    };

    tick();
    const interval = setInterval(() => {
      if (!tick()) clearInterval(interval);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [contest.date, contest.time]);

  const idMatch = contest.name.match(/\b\d{3,4}\b/);
  const displayId = idMatch ? `#${idMatch[0]}` : null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6 flex items-center justify-between">
          <span className="rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-[0.15em]" style={{ background: 'var(--text-primary)', color: 'var(--bg-card)' }}>
            UPCOMING
          </span>
          {displayId && (
            <span className="rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-widest" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              {displayId}
            </span>
          )}
        </div>

        <h3 className="mb-8 text-[22px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {contest.name}
        </h3>

        <div className="mb-10 flex items-center justify-center rounded-[20px] py-6 shadow-inner" style={{ background: 'var(--gray-950)', border: '1px solid var(--border-subtle)' }}>
          {timeLeft ? (
            <div className="font-mono-data flex items-baseline gap-2 text-2xl font-black text-white">
              {timeLeft.d > 0 && (
                <>
                  <span>{pad(timeLeft.d)}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">D</span>
                  <span className="mx-1.5 pb-1 text-[var(--text-muted)]">:</span>
                </>
              )}
              <span>{pad(timeLeft.h)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">H</span>
              <span className="mx-1.5 pb-1 text-[var(--text-muted)]">:</span>
              <span>{pad(timeLeft.m)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">M</span>
              <span className="mx-1.5 pb-1 text-[var(--text-muted)]">:</span>
              <span>{pad(timeLeft.s)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">S</span>
            </div>
          ) : (
            <div className="font-mono-data text-2xl font-black text-[var(--text-muted)]">-- : -- : --</div>
          )}
        </div>

        <div className="mt-auto space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex shrink-0 items-center justify-center rounded-full p-3.5" style={{ border: '1px solid var(--border-default)' }}>
              <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[0.15em] text-[var(--text-muted)]">LAUNCH SCHEDULE</p>
              <p className="mt-0.5 text-sm font-bold text-[var(--text-primary)]">
                {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(contest.date))} <span className="font-normal text-[var(--text-muted)]">@ {contest.time}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex shrink-0 items-center justify-center rounded-full p-3.5" style={{ border: '1px solid var(--border-default)' }}>
              <Clock size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[0.15em] text-[var(--text-muted)]">COMPETITION WINDOW</p>
              <p className="mt-0.5 font-mono-data text-[13px] font-bold text-[var(--text-secondary)]">{parseDuration(contest.platform)}</p>
            </div>
          </div>
        </div>
      </div>

      <a
        href={contest.href}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-2 py-5 text-[11px] font-bold tracking-[0.2em] transition-opacity hover:opacity-90"
        style={{ background: 'var(--text-primary)', color: 'var(--bg-card)', textDecoration: 'none' }}
      >
        SECURE ACCESS <ChevronRight size={14} strokeWidth={3} />
      </a>
    </div>
  );
}
