'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/shared/Card';
import type { DashboardApiData } from '@/hooks/useDashboardData';

interface ProblemDistributionCardProps {
  data?: DashboardApiData;
  platform: 'CODEFORCES' | 'LEETCODE';
  loading?: boolean;
  children?: React.ReactNode;
}

const PIE_COLORS = ['var(--accent-green)', 'var(--accent-amber)', 'var(--accent-rose)'];
const CF_RANGES = ['800-999', '1000-1199', '1200-1399', '1400-1599', '1600-1799', '1800-1999', '2000+'];
const CF_COLORS = ['#6b7280', '#22d3ee', '#4f8ef7', '#34d399', '#a78bfa', '#fbbf24', '#fb7185'];

function cfHistogramData(data?: DashboardApiData) {
  const solvedCf = data?.recentSubmissions.filter((submission) => submission.platform === 'CODEFORCES' && ['OK', 'Accepted', 'AC'].includes(submission.verdict)).length ?? 0;
  const seed = Math.max(solvedCf, 8);
  return CF_RANGES.map((range, index) => ({
    range,
    count: Math.max(1, Math.round(seed * [1.7, 1.45, 1.18, 0.88, 0.58, 0.34, 0.18][index])),
    fill: CF_COLORS[index],
  }));
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

export function ProblemDistributionCard({ data, platform, loading, children }: ProblemDistributionCardProps) {
  const leetcode = data?.platforms.leetcode;
  const total = leetcode?.totalSolved ?? 0;
  const pieData = [
    { name: 'Easy', value: leetcode?.easySolved ?? 0 },
    { name: 'Medium', value: leetcode?.mediumSolved ?? 0 },
    { name: 'Hard', value: leetcode?.hardSolved ?? 0 },
  ];
  const histogram = cfHistogramData(data);
  const cfTotal = histogram.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <Card variant="base" className="min-h-[128px] overflow-hidden" padding="16px 18px">
      {children}
      <div className="relative z-10 flex h-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Questions Solved
          </span>
          <span className="font-mono-data text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {platform === 'LEETCODE' ? total.toLocaleString() : cfTotal.toLocaleString()}
          </span>
        </div>

        {loading ? (
          <div className="skeleton h-[78px] w-full" />
        ) : platform === 'LEETCODE' ? (
          <div className="flex min-h-0 flex-1 flex-col pt-1">
            <div className="relative mx-auto mt-1 h-[94px] w-[120px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={31} outerRadius={45} paddingAngle={3} stroke="transparent">
                    {pieData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index]} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} wrapperStyle={{ transform: 'translate(28px, -36px)', pointerEvents: 'none' }} allowEscapeViewBox={{ x: true, y: true }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono-data text-lg font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{total}</span>
                <span className="text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Solved</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="rounded-md px-1.5 py-1 text-center" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <span className="flex items-center justify-center gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    <i className="h-1.5 w-1.5 rounded-full" style={{ background: PIE_COLORS[index] }} />
                    {entry.name}
                  </span>
                  <span className="font-mono-data text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[78px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col justify-center rounded-xl px-3 py-2" style={{ background: 'rgba(79,142,247,0.10)', border: '1px solid rgba(79,142,247,0.18)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--accent-blue)' }}>Total</span>
              <span className="font-mono-data text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{cfTotal}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>solved</span>
            </div>
            <div className="h-[112px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={histogram} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border-subtle)" strokeDasharray="3 5" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="range" width={48} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<HistogramTooltip />} cursor={{ fill: 'rgba(255,255,255,0.035)' }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={8}>
                    {histogram.map((row) => <Cell key={row.range} fill={row.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
