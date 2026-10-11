'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import type { ContestItem } from '@/hooks/useContestsData';

export function CombinedRatingCard({ 
  avgRank, 
  rankedContests,
  history, 
  isLoading 
}: { 
  avgRank: number; 
  rankedContests: number;
  history: ContestItem[]; 
  isLoading: boolean;
}) {
  const chartData = useMemo(() => {
    return [...history].reverse().map((c) => ({
      name: c.name,
      date: new Date(c.date).getTime(),
      dateStr: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      year: new Date(c.date).getFullYear(),
      rating: c.after,
      delta: c.after - c.before,
      rank: c.rank,
      solved: c.solved,
      total: c.total,
      platform: c.platform,
    }));
  }, [history]);

  const displayPlatforms = useMemo(() => {
    const present = new Set(chartData.map(d => d.platform));
    return (['CODEFORCES', 'LEETCODE', 'CODECHEF'] as const).filter(p => present.has(p as any));
  }, [chartData]);

  const [hovered, setHovered] = useState<any>(null);

  if (isLoading) {
    return (
      <Card padding="18px" className="flex min-h-[152px] items-center justify-center">
        <span className="text-xs text-[var(--text-muted)]">Loading...</span>
      </Card>
    );
  }

  const currentDisplay = hovered || chartData[chartData.length - 1];

  return (
    <Card padding="16px" className="relative flex min-h-[180px] flex-col gap-4 overflow-hidden sm:flex-row">
      {/* Left side: Avg Rank */}
      <div className="flex flex-col justify-between shrink-0 sm:border-r border-[var(--border-subtle)] sm:pr-4 sm:w-[140px]">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Avg Rank</span>
          <div className="mt-1">
            <span className="font-mono-data text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              {avgRank > 0 ? `#${avgRank.toLocaleString()}` : 'N/A'}
            </span>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {rankedContests > 0 ? `From ${rankedContests} ranked contests` : 'No ranked contests'}
            </p>
          </div>
        </div>
        {currentDisplay && (
          <div className="mt-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Contest Rating</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="font-mono-data text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {currentDisplay.rating?.toLocaleString()}
              </span>
              {currentDisplay.delta > 0 ? (
                <TrendingUp size={14} className="text-emerald-500" />
              ) : currentDisplay.delta < 0 ? (
                <TrendingDown size={14} className="text-rose-500" />
              ) : (
                <Minus size={14} className="text-gray-500" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right side: Graph */}
      <div className="flex-1 flex flex-col min-w-0 pt-0.5">
        <div className="flex justify-between items-start mb-2 min-h-[32px]">
          {currentDisplay ? (
            <>
              <div>
                <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{currentDisplay.dateStr}</p>
                <p className="text-[12px] font-bold truncate max-w-[180px] xl:max-w-[240px]" style={{ color: 'var(--text-primary)' }}>{currentDisplay.name}</p>
              </div>
              <div className="text-right flex gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-muted)' }}>Rank</p>
                  <p className="text-[12px] font-mono-data font-bold" style={{ color: 'var(--text-primary)' }}>{currentDisplay.rank ? currentDisplay.rank.toLocaleString() : '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-muted)' }}>Solved</p>
                  <p className="text-[12px] font-mono-data font-bold" style={{ color: 'var(--text-primary)' }}>{currentDisplay.solved}/{currentDisplay.total}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-[var(--text-muted)]">No contest history to chart.</div>
          )}
        </div>
        <div className="relative mt-1 min-h-[58px] w-full flex-1 -mx-1 -mb-1 flex flex-col gap-1">
          {displayPlatforms.map(platform => {
            const pData = chartData.filter(d => d.platform === platform);
            const color = platform === 'CODEFORCES' ? '#3b82f6' : platform === 'CODECHEF' ? '#b45309' : '#f59e0b';
            const label = platform === 'CODEFORCES' ? 'CF' : platform === 'CODECHEF' ? 'CC' : 'LC';
            return (
              <div key={platform} className="flex-1 min-h-0 w-full flex items-center gap-1.5 relative">
                {/* Platform badge label */}
                <div
                  className="flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono-data border leading-none"
                  style={{
                    background: `${color}15`,
                    borderColor: `${color}35`,
                    color,
                    minWidth: '42px',
                  }}
                  title={platform === 'CODEFORCES' ? 'Codeforces' : platform === 'CODECHEF' ? 'CodeChef' : 'LeetCode'}
                >
                  <PlatformLogo platform={platform} size={12} active={true} />
                  <span>{label}</span>
                </div>
                {/* Line chart */}
                <div className="flex-1 h-full min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={pData} 
                      onMouseMove={(e) => {
                        if (e.activePayload) setHovered(e.activePayload[0].payload);
                      }}
                      onMouseLeave={() => setHovered(null)}
                      margin={{ top: 2, right: 6, bottom: 2, left: 2 }}
                    >
                      <XAxis dataKey="year" hide />
                      <Tooltip 
                        content={<></>} 
                        cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke={color} 
                        strokeWidth={2}
                        dot={{ r: 0, fill: color, strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: color, stroke: '#11131d', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between px-2 pt-1 text-[9px] font-medium tracking-wider" style={{ color: 'var(--text-muted)' }}>
          <span>{chartData[0]?.year}</span>
          <span>{chartData[chartData.length - 1]?.year}</span>
        </div>
      </div>
    </Card>
  );
}
