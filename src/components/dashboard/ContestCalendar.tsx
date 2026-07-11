'use client';

import { Card } from '@/components/shared/Card';
import { Clock3, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface RatingPoint {
  date: string;
  cfRating?: number;
  lcRating?: number;
  userRating?: number;
}

interface ContestCalendarProps {
  data?: RatingPoint[];
  loading?: boolean;
}

interface ContestDay {
  date: Date;
  label: string;
  delta?: number;
  type: 'given' | 'upcoming';
}

function buildContestDays(data: RatingPoint[] = []): ContestDay[] {
  const history = data
    .map((point) => ({
      date: new Date(point.date),
      rating: point.userRating ?? point.cfRating ?? point.lcRating,
    }))
    .filter((point): point is { date: Date; rating: number } => typeof point.rating === 'number')
    .slice(-4);

  const previous = history.map((point, index) => {
    const previousRating = history[index - 1]?.rating ?? point.rating - 12;
    return {
      date: point.date,
      label: index % 2 === 0 ? 'Codeforces Round' : 'Weekly Contest',
      delta: Math.round(point.rating - previousRating),
      type: 'given' as const,
    };
  });

  const today = new Date();
  const upcoming = [6, 13, 21].map((offset, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return {
      date,
      label: index === 1 ? 'LeetCode Weekly' : 'Codeforces Round',
      type: 'upcoming' as const,
    };
  });

  return [...previous, ...upcoming].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function ContestCalendar({ data = [], loading = false }: ContestCalendarProps) {
  const contests = buildContestDays(data);

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
  const nextDeltaMs = nextContest ? nextContest.date.getTime() - now.getTime() : 0;
  const isLive = nextContest ? nextDeltaMs <= 2 * 60 * 60 * 1000 : false;
  const countdown = nextContest
    ? isLive
      ? 'Live'
      : nextDeltaMs > 24 * 60 * 60 * 1000
        ? Math.ceil(nextDeltaMs / (24 * 60 * 60 * 1000)) + 'd'
        : Math.max(1, Math.ceil(nextDeltaMs / (60 * 60 * 1000))) + 'h'
    : 'No contests';
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
          <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {format(now, 'MMMM yyyy')}
          </p>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold"
          style={{ background: isLive ? 'rgba(52,211,153,0.12)' : 'var(--accent-blue-dim)', color: isLive ? 'var(--accent-green)' : 'var(--accent-blue)', border: isLive ? '1px solid rgba(52,211,153,0.24)' : '1px solid rgba(79,142,247,0.22)' }}
        >
          <Clock3 size={13} />
          {countdown}
        </span>
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
                    : 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(167,139,250,0.08))'
                  : 'var(--bg-input)',
                border: today
                  ? '1px solid var(--accent-blue)'
                  : event
                    ? '1px solid rgba(79,142,247,0.24)'
                    : '1px solid var(--border-subtle)',
                opacity: inMonth ? 1 : 0.36,
              }}
            >
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {date.getDate()}
              </span>
              {event?.type === 'given' && (
                <span className="font-mono-data text-[10px] font-bold" style={{ color: positive ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                  {positive ? '+' : ''}
                  {event.delta}
                </span>
              )}
              {event?.type === 'upcoming' && <Trophy size={12} style={{ color: 'var(--accent-amber)' }} />}
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
          <i className="h-2 w-2 rounded-full" style={{ background: 'var(--accent-amber)' }} />
          Upcoming
        </span>
      </div>
    </Card>
  );
}
