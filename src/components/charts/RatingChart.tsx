'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceDot,
} from 'recharts';
import { format } from 'date-fns';
import { Card } from '@/components/shared/Card';
import { ChevronDown, Layers3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';

export interface RatingPoint {
  date: string;
  cfRating?: number;
  lcRating?: number;
  userRating?: number;
  friendRating?: number;
  friend1?: number;
  friend2?: number;
  friend3?: number;
  friend4?: number;
}

interface RatingChartProps {
  data: RatingPoint[];
  loading?: boolean;
  compact?: boolean;
}

type FriendMode = 'top4' | 'avg';

const TIME_FILTERS = ['Today', '7d', '2w', '1m', '3m', '1y'];
const FRIEND_KEYS = ['friend1', 'friend2', 'friend3', 'friend4'] as const;
const CF_MILESTONES = [
  { value: 1200, label: 'Specialist', color: 'var(--accent-cyan)' },
  { value: 1600, label: 'Expert', color: 'var(--accent-blue)' },
  { value: 1900, label: 'Candidate Master', color: 'var(--accent-purple)' },
  { value: 2100, label: 'Master', color: 'var(--accent-amber)' },
];
const LC_MILESTONES = [
  { value: 1600, label: 'Knight', color: 'var(--accent-cyan)' },
  { value: 2000, label: 'Guardian', color: 'var(--accent-purple)' },
  { value: 2300, label: 'Champion', color: 'var(--accent-amber)' },
];

const SERIES = [
  { key: 'userRating', name: 'You', color: 'var(--line-you)', primary: true },
  { key: 'friend1', name: 'Friend 1', color: 'var(--line-f1)', primary: false },
  { key: 'friend2', name: 'Friend 2', color: 'var(--line-f2)', primary: false },
  { key: 'friend3', name: 'Friend 3', color: 'var(--line-f3)', primary: false },
  { key: 'friend4', name: 'Friend 4', color: 'var(--line-f4)', primary: false },
  { key: 'avgTop4', name: 'Avg Top 4', color: 'var(--accent-cyan)', primary: false },
] as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label ? format(new Date(label), 'MMM d, yyyy') : ''}
      </p>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="min-w-[74px] text-xs" style={{ color: p.name === 'You' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: p.name === 'You' ? 700 : 500 }}>{p.name}</span>
            <span className="font-mono-data text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.round(p.value).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RatingChart({ data, loading, compact = false }: RatingChartProps) {
  const [friendMode, setFriendMode] = useState<FriendMode>('top4');
  const [modeOpen, setModeOpen] = useState(false);
  const { selectedPlatform } = useUIStore();
  const milestones = selectedPlatform === 'CODEFORCES' ? CF_MILESTONES : LC_MILESTONES;

  const chartData = useMemo(() => data.map((d) => {
    const point = {
      ...d,
      userRating: d.userRating ?? (selectedPlatform === 'CODEFORCES' ? d.cfRating : d.lcRating),
      friend1: d.friend1 ?? d.friendRating,
      avgTop4: undefined as number | undefined,
    };
    const friendValues = FRIEND_KEYS.map((key) => point[key]).filter((value): value is number => typeof value === 'number');
    point.avgTop4 = friendValues.length ? friendValues.reduce((sum, value) => sum + value, 0) / friendValues.length : undefined;
    return point;
  }), [data, selectedPlatform]);

  const activeFriendKeys = friendMode === 'avg' ? ['avgTop4'] : FRIEND_KEYS;
  const visibleSeries = SERIES.filter((series) => {
    if (series.primary) return chartData.some((point) => typeof point.userRating === 'number');
    if (!activeFriendKeys.includes(series.key as any)) return false;
    return chartData.some((point) => typeof (point as any)[series.key] === 'number');
  });
  const bestPoint = chartData.reduce<(typeof chartData)[number] | null>((best, point) => {
    if (typeof point.userRating !== 'number') return best;
    if (!best || (point.userRating ?? 0) > (best.userRating ?? 0)) return point;
    return best;
  }, null);
  const reachedMilestones = milestones.map((milestone) => {
    const point = chartData.find((item) => typeof item.userRating === 'number' && item.userRating >= milestone.value);
    return point ? { ...milestone, point } : null;
  }).filter((item): item is typeof milestones[number] & { point: (typeof chartData)[number] } => Boolean(item));

  if (loading) {
    return (
      <Card variant="raised" padding={compact ? '16px' : '22px'}>
        <div className="flex flex-col gap-3">
          <div className="skeleton h-4 w-32" />
          <div className={compact ? 'skeleton h-[250px] w-full' : 'skeleton h-[240px] w-full'} />
        </div>
      </Card>
    );
  }

  if (!chartData.length || !visibleSeries.length) {
    return (
      <Card variant="raised" padding={compact ? '16px' : '22px'}>
        <div className={compact ? 'flex h-[250px] items-center justify-center' : 'flex h-[240px] items-center justify-center'}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No rating history yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="raised" padding={compact ? '16px' : '22px'}>
      <div className="mb-4 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Rating Progress
          </span>
          <div className="flex items-center gap-1">
            {TIME_FILTERS.map((filter) => {
              const active = filter === '1y';
              return (
                <button key={filter} style={{ background: active ? 'var(--accent-blue-dim)' : 'transparent', border: 'none', color: active ? 'var(--accent-blue)' : 'var(--text-muted)', borderRadius: '20px', padding: compact ? '2px 9px' : '3px 12px', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}>
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setModeOpen((value) => !value)}
              className="flex h-9 min-w-[148px] items-center justify-between gap-2 rounded-full px-3 text-xs font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(79,142,247,0.14), rgba(34,211,238,0.06))',
                border: '1px solid rgba(79,142,247,0.26)',
                color: 'var(--text-primary)',
              }}
            >
              <span className="flex items-center gap-2">
                <Layers3 size={14} style={{ color: 'var(--accent-blue)' }} />
                {friendMode === 'top4' ? 'Top 4 Friends' : 'Avg of top 4'}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <AnimatePresence>
              {modeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                className="absolute right-0 top-11 z-50 w-44 rounded-lg p-1.5"
                style={{
                  background: 'rgba(17,19,29,0.92)',
                  border: '1px solid var(--border-default)',
                  boxShadow: '0 18px 48px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {[
                  { value: 'top4' as const, label: 'Top 4 Friends' },
                  { value: 'avg' as const, label: 'Avg of top 4' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setFriendMode(item.value);
                      setModeOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold"
                    style={{
                      background: friendMode === item.value ? 'var(--accent-blue-dim)' : 'transparent',
                      color: friendMode === item.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: item.value === 'top4' ? 'var(--accent-blue)' : 'var(--accent-cyan)' }} />
                    {item.label}
                  </button>
                ))}
              </motion.div>
              )}
            </AnimatePresence>
          </div>
          {visibleSeries.some((series) => series.primary) && (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--line-you)', boxShadow: '0 0 6px rgba(79,142,247,0.45)' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 700 }}>You</span>
            </div>
          )}
          {friendMode === 'top4' && visibleSeries.some((series) => !series.primary) && (
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-9 rounded-full" style={{ background: 'linear-gradient(90deg, var(--line-f1) 0 25%, var(--line-f2) 25% 50%, var(--line-f3) 50% 75%, var(--line-f4) 75% 100%)', boxShadow: '0 0 8px rgba(167,139,250,0.25)' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>Friends</span>
            </div>
          )}
          {friendMode === 'avg' && visibleSeries.some((series) => series.key === 'avgTop4') && (
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-8 rounded-full" style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 8px rgba(34,211,238,0.35)' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Friends</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height: compact ? '250px' : '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="grad-you" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f8ef7" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#4f8ef7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), 'MMM yy')} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={compact ? 28 : 20} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} />
            {visibleSeries.filter((series) => !series.primary).map((series) => (
              <Line key={series.key} type="monotone" dataKey={series.key} name={series.name} stroke={series.color} strokeWidth={series.key === 'avgTop4' ? 2.25 : 1.5} strokeDasharray={series.key === 'avgTop4' ? undefined : '4 2'} dot={false} isAnimationActive animationDuration={700} connectNulls />
            ))}

            {visibleSeries.some((series) => series.primary) && (
              <Area type="monotone" dataKey="userRating" name="You" stroke="var(--line-you)" strokeWidth={3} fill="url(#grad-you)" fillOpacity={0.12} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: 'var(--line-you)', style: { filter: 'drop-shadow(0 0 6px #4f8ef7)' } }} isAnimationActive animationDuration={800} connectNulls />
            )}
            {bestPoint && typeof bestPoint.userRating === 'number' && (
              <ReferenceDot
                x={bestPoint.date}
                y={bestPoint.userRating}
                r={5}
                fill="var(--accent-amber)"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={2}
                label={{ value: 'Best', position: 'top', fill: 'var(--accent-amber)', fontSize: 11, fontWeight: 700 }}
              />
            )}
            {reachedMilestones.map((milestone) => (
              <ReferenceDot
                key={milestone.label}
                x={milestone.point.date}
                y={milestone.value}
                r={4}
                fill={milestone.color}
                stroke="rgba(255,255,255,0.82)"
                strokeWidth={1.5}
                label={{ value: milestone.label, position: 'bottom', fill: milestone.color, fontSize: 10, fontWeight: 700 }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
