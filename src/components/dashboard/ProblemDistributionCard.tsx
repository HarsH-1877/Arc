'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import { Card } from '@/components/shared/Card';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import type { DashboardApiData } from '@/hooks/useDashboardData';

interface ProblemDistributionCardProps {
  data?: DashboardApiData;
  platform: 'ALL' | 'CODEFORCES' | 'LEETCODE';
  loading?: boolean;
  children?: React.ReactNode;
}

const PIE_COLORS = ['var(--accent-green)', 'var(--accent-amber)', 'var(--accent-rose)'];
function cfHistogramData(data?: DashboardApiData) {
  const stats = data?.platforms.codeforces?.difficultyStats ?? {};

  const getCountInRange = (min: number, max: number) => {
    let sum = 0;
    for (const [ratingStr, count] of Object.entries(stats)) {
      const r = Number(ratingStr);
      if (!Number.isNaN(r) && r >= min && r <= max) {
        sum += Number(count) || 0;
      }
    }
    return sum;
  };

  return [
    { range: '800-999', count: getCountInRange(800, 999), fill: '#4f8ef7' },
    { range: '1000-1199', count: getCountInRange(1000, 1199), fill: '#4f8ef7' },
    { range: '1200-1399', count: getCountInRange(1200, 1399), fill: '#4f8ef7' },
    { range: '1400-1599', count: getCountInRange(1400, 1599), fill: '#4f8ef7' },
    { range: '1600-1799', count: getCountInRange(1600, 1799), fill: '#4f8ef7' },
    { range: '1800-1999', count: getCountInRange(1800, 1999), fill: '#4f8ef7' },
    { range: '2000+', count: getCountInRange(2000, 9999), fill: '#4f8ef7' },
    { range: 'Unrated', count: Number(stats.UNRATED) || 0, fill: '#64748b' },
  ];
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div style={{ background: '#11131d', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '10px 12px', boxShadow: '0 14px 36px rgba(0,0,0,0.58)' }}>
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{row.name}</p>
      </div>
      <p className="font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>{row.value} solved</p>
    </div>
  );
}

function HistogramTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div style={{ background: '#11131d', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '10px 12px', boxShadow: '0 14px 36px rgba(0,0,0,0.58)' }}>
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: row.fill }} />
        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{row.range}</p>
      </div>
      <p className="font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>{row.count} accepted problems</p>
    </div>
  );
}

export function ProblemDistributionCard({ data, platform, loading, children, className }: ProblemDistributionCardProps & { className?: string }) {
  const leetcode = data?.platforms.leetcode;
  const total = leetcode?.totalSolved ?? 0;
  const pieData = [
    { name: 'Easy', value: leetcode?.easySolved ?? 0 },
    { name: 'Medium', value: leetcode?.mediumSolved ?? 0 },
    { name: 'Hard', value: leetcode?.hardSolved ?? 0 },
  ];
  const histogram = cfHistogramData(data);
  const cfTotal = data?.platforms.codeforces?.totalSolved ?? histogram.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <Card variant="base" className={className || "min-h-[128px] overflow-hidden"} padding="20px 24px">
      {children}
      <div className="relative z-10 flex h-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Questions Solved
          </span>
    
        </div>

        {loading ? (
          <div className="skeleton h-[78px] w-full" />
        ) : platform === 'LEETCODE' ? (
          <div className="flex min-h-0 flex-1 flex-col pt-1">
            <div className="relative mx-auto mt-1 h-[124px] w-[156px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={58} paddingAngle={3} stroke="transparent">
                    {pieData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index]} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} wrapperStyle={{ transform: 'translate(28px, -36px)', pointerEvents: 'none' }} allowEscapeViewBox={{ x: true, y: true }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono-data text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{total}</span>
                <span className="text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Solved</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="px-1 text-center">
                  <span className="flex items-center justify-center gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    <i className="h-1.5 w-1.5 rounded-full" style={{ background: PIE_COLORS[index] }} />
                    {entry.name}
                  </span>
                  <span className="font-mono-data text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : platform === 'CODEFORCES' ? (
          <div className="grid min-h-0 flex-1 grid-cols-[92px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col justify-center rounded-[20px] px-3 py-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-default)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--accent-blue)' }}>Total</span>
              <span className="font-mono-data text-xl whitespace-nowrap truncate font-bold leading-tight" style={{ color: 'var(--text-primary)' }} title={String(cfTotal)}>{cfTotal}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>solved</span>
            </div>
            <div className="h-full w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={histogram} margin={{ top: 2, right: 24, bottom: 2, left: 0 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border-subtle)" strokeDasharray="3 5" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="range" width={54} interval={0} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<HistogramTooltip />} cursor={{ fill: 'rgba(255,255,255,0.035)' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={8}>
                    {histogram.map((row) => <Cell key={row.range} fill={row.fill} />)}
                    <LabelList dataKey="count" position="right" fill="var(--text-muted)" fontSize={9} fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* platform === 'ALL' */
          <div className="flex flex-col justify-between flex-1 py-1">
            <div className="flex flex-col">
              <span className="font-mono-data text-3xl sm:text-4xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
                {(total + cfTotal).toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider mt-1 text-[var(--text-muted)]">
                Total Solved Across All Platforms
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <PlatformLogo platform="LEETCODE" size={14} />
                <span className="font-mono-data font-bold">{total}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <PlatformLogo platform="CODEFORCES" size={14} />
                <span className="font-mono-data font-bold">{cfTotal}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
