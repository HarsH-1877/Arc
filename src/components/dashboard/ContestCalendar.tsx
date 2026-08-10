'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Clock3, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import type { DashboardApiData } from '@/hooks/useDashboardData';

interface ContestCalendarProps {
  events?: DashboardApiData['contestCalendarEvents'];
  loading?: boolean;
}

interface ContestDay {
  date: Date;
  label: string;
  delta?: number;
  type: 'given' | 'upcoming' | 'missed';
  platforms: Array<{ platform: 'CODEFORCES' | 'LEETCODE'; href?: string; registrationOpen?: boolean }>;
}

function LiveContestTimer({ nextContest }: { nextContest?: ContestDay }) {
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!nextContest) {
      setTimeLeft('No contests');
      return;
    }

    const updateTimer = () => {
      const diffMs = nextContest.date.getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeLeft('Live');
        return;
      }
      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');

      if (days > 0) {
        setTimeLeft(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextContest]);

  const platformInfo = nextContest?.platforms[0];

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-mono-data font-bold cursor-pointer transition-all hover:scale-105"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
        }}
      >
        <Clock3 size={13} className="text-amber-400" />
        <span>{timeLeft}</span>
      </div>

      {showTooltip && nextContest && (
        <div
          className="absolute right-0 top-9 z-50 w-64 rounded-xl p-3 shadow-xl text-xs space-y-1.5"
          style={{
            background: 'rgba(17,19,29,0.95)',
            border: '1px solid var(--border-default)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between font-bold border-b border-[var(--border-subtle)] pb-1.5">
            <span style={{ color: 'var(--text-primary)' }}>Next Contest</span>
            {platformInfo && (
              <PlatformLogo platform={platformInfo.platform} size={14} />
            )}
          </div>
          <p className="font-semibold text-[var(--text-primary)] truncate">
            {nextContest.label}
          </p>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
            <span>Date:</span>
            <span className="font-mono-data font-semibold text-[var(--text-secondary)]">
              {format(nextContest.date, 'MMM d, yyyy HH:mm')}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
            <span>Status:</span>
            <span className="font-semibold text-amber-400">
              {platformInfo?.registrationOpen ? 'Registration Open' : 'Upcoming'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function buildContestDays(events: NonNullable<DashboardApiData['contestCalendarEvents']> = []): ContestDay[] {
  const grouped = new Map<string, ContestDay>();

  for (const event of events) {
    const date = new Date(event.date);
    const key = date.toDateString();
    const existing = grouped.get(key);

    if (existing) {
      if (!existing.platforms.some((item) => item.platform === event.platform)) {
        existing.platforms.push({ platform: event.platform, href: event.href, registrationOpen: event.registrationOpen });
      }
      if (event.type === 'given' && typeof event.delta === 'number') existing.delta = event.delta;
      if (event.type !== 'upcoming') existing.type = event.type;
      if (existing.label !== event.label) existing.label = `${existing.label} & ${event.label}`;
    } else {
      grouped.set(key, {
        date,
        label: event.label,
        delta: event.delta,
        type: event.type,
        platforms: [{ platform: event.platform, href: event.href, registrationOpen: event.registrationOpen }],
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function ContestCalendar({ events = [], loading = false }: ContestCalendarProps) {
  const contests = buildContestDays(events);

  if (loading) {
    return (
      <Card padding="14px" className="gap-3">
        <div className="skeleton h-4 w-32" />
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={index} className="skeleton aspect-square" />
          ))}
        </div>
      </Card>
    );
  }

  const now = new Date();
  const nextContest = contests.find((contest) => contest.type === 'upcoming' && contest.date.getTime() >= now.getTime());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const days = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const eventForDay = (date: Date) =>
    contests.find((contest) => contest.date.toDateString() === date.toDateString());

  return (
    <Card padding="14px" className="gap-3 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Contest Calendar
          </span>
          <button className="mt-1 flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
            {format(now, 'MMMM yyyy')}
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        <LiveContestTimer nextContest={nextContest} />
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <span key={day + index}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((date) => {
          const event = eventForDay(date);
          const inMonth = date.getMonth() === now.getMonth();
          const today = date.toDateString() === now.toDateString();
          const positive = (event?.delta ?? 0) >= 0;

          return (
            <div
              key={date.toISOString()}
              className="relative flex aspect-square min-h-[30px] flex-col justify-between rounded-md p-1.5"
              title={event ? event.label : undefined}
              style={{
                background: event
                  ? event.type === 'given'
                    ? 'linear-gradient(135deg, rgba(79,142,247,0.18), rgba(52,211,153,0.08))'
                    : event.type === 'missed'
                      ? 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.04))'
                      : 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(167,139,250,0.08))'
                  : 'var(--bg-input)',
                border: today
                  ? '1px solid var(--accent-blue)'
                  : event
                    ? event.type === 'missed'
                      ? '1px solid rgba(244,63,94,0.25)'
                      : '1px solid rgba(79,142,247,0.24)'
                    : '1px solid var(--border-subtle)',
                opacity: inMonth ? 1 : 0.36,
              }}
            >
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold leading-none" style={{ color: 'var(--text-secondary)' }}>
                  {date.getDate()}
                </span>
                {event?.type === 'given' && typeof event.delta === 'number' && (
                  <span className="font-mono-data text-[8px] font-bold leading-none" style={{ color: positive ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                    {positive ? '+' : ''}
                    {event.delta}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-end mt-auto">
                <div>
                  {event && event.platforms.length > 1 && (
                    <ContestLogo item={event.platforms[1]} label={event.label} />
                  )}
                </div>
                <div>
                  {event && event.platforms.length > 0 && (
                    <ContestLogo item={event.platforms[0]} label={event.label} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full" style={{ background: 'var(--accent-blue)' }} />
          Given
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full" style={{ background: 'var(--accent-rose)' }} />
          Missed
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full" style={{ background: 'var(--accent-amber)' }} />
          Upcoming
        </span>
      </div>
    </Card>
  );
}

function ContestLogo({ item, label }: { item: ContestDay['platforms'][number]; label: string }) {
  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex rounded-sm p-0.5 hover:bg-white/[0.08]"
        title={label}
        onClick={(e) => {
          if (item.registrationOpen === false) {
            e.preventDefault();
            toast.error('Registration not started yet', {
              description: 'Check back closer to the contest start time.',
              duration: 3000,
            });
          }
        }}
      >
        <PlatformLogo platform={item.platform} size={12} className="transition-transform duration-150 group-hover:scale-110" />
      </a>
    );
  }
  return (
    <span className="group inline-flex rounded-sm p-0.5 hover:bg-white/[0.08]" title={label}>
      <PlatformLogo platform={item.platform} size={12} className="transition-transform duration-150 group-hover:scale-110" />
    </span>
  );
}
