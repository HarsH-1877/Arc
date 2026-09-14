'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

interface ContestItem {
  id: string;
  name: string;
  platform: 'CODEFORCES' | 'LEETCODE';
  date: string;
  time: string;
  startTime?: string;
  href: string;
  registrationOpen?: boolean;
}



function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function UpcomingContestCard({ contest }: { contest: ContestItem }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(contest.startTime ?? `${contest.date}T${contest.time}:00`).getTime();
    
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
  }, [contest.date, contest.time, contest.startTime]);

  const launchTime = new Date(contest.startTime ?? `${contest.date}T${contest.time}:00`);

  let displayId: string | null = null;
  let roundNumber: string | null = null;
  const canRegister = contest.registrationOpen === true;
  if (contest.platform === 'CODEFORCES') {
    // Extract round number from "Codeforces Round 998", "Codeforces Round #998", or "Educational Codeforces Round 172"
    const roundMatch = contest.name.match(/Round\s+#?(\d+)/i);
    if (roundMatch) {
      roundNumber = roundMatch[1];
    }

    // Extract whatever is inside the brackets — handles Div. 1, Div. 2, Div. 1+2, Div. 3, Div. 4, etc.
    const bracketMatch = contest.name.match(/\(([^)]+)\)/);
    if (bracketMatch) {
      displayId = bracketMatch[1].trim();
    } else if (/Educational/i.test(contest.name)) {
      displayId = 'Edu';
    } else if (/Global/i.test(contest.name)) {
      displayId = 'Global';
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[24px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex flex-col p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-[18px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {contest.name.replace(/\s*\([^)]*\)/g, '').trim()}
          </h3>
          {displayId && (
            <span className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              {displayId}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[16px] p-3 shadow-inner" style={{ background: 'var(--gray-950)', border: '1px solid var(--border-subtle)' }}>
          {timeLeft ? (
            <div className="font-mono-data flex items-baseline gap-1.5 text-lg font-black text-white">
              {timeLeft.d > 0 && (
                <>
                  <span>{pad(timeLeft.d)}</span>
                  <span className="text-[9px] text-[var(--text-muted)]">D</span>
                  <span className="mx-0.5 pb-0.5 text-[var(--text-muted)]">:</span>
                </>
              )}
              <span>{pad(timeLeft.h)}</span>
              <span className="text-[9px] text-[var(--text-muted)]">H</span>
              <span className="mx-0.5 pb-0.5 text-[var(--text-muted)]">:</span>
              <span>{pad(timeLeft.m)}</span>
              <span className="text-[9px] text-[var(--text-muted)]">M</span>
              <span className="mx-0.5 pb-0.5 text-[var(--text-muted)]">:</span>
              <span>{pad(timeLeft.s)}</span>
              <span className="text-[9px] text-[var(--text-muted)]">S</span>
            </div>
          ) : (
            <div className="font-mono-data text-lg font-black text-[var(--text-muted)]">--:--:--</div>
          )}

          <div className="h-8 w-px shrink-0" style={{ background: 'var(--border-subtle)' }} />

          <div className="flex flex-col items-end text-right">
            <p className="text-[8px] font-bold tracking-[0.15em] text-[var(--text-muted)]">LAUNCH</p>
            <p className="mt-0.5 text-[11px] font-bold text-[var(--text-primary)]">
              {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(launchTime)} <span className="font-normal text-[var(--text-muted)]">{new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(launchTime)}</span>
            </p>
          </div>
        </div>
      </div>

      {canRegister ? (
        <a
          href={contest.href}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 py-3 text-[11px] font-bold tracking-[0.2em] transition-opacity hover:opacity-90"
          style={{ background: 'var(--text-primary)', color: 'var(--bg-card)', textDecoration: 'none' }}
        >
          REGISTER <ChevronRight size={14} strokeWidth={3} />
        </a>
      ) : (
        <div className="flex w-full items-center justify-center gap-2 py-3 text-[11px] font-bold tracking-[0.15em]" style={{ background: 'rgba(251,191,36,0.08)', color: 'var(--accent-amber)', borderTop: '1px solid rgba(251,191,36,0.2)' }}>
          <span>⏳</span> REGISTRATION SOON
        </div>
      )}
    </div>
  );
}
