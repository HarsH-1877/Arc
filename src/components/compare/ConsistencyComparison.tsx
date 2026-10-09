'use client';

import { Card } from '@/components/shared/Card';
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap';
import type { CompareUser } from '@/hooks/useCompareData';
import { useUIStore } from '@/store/useUIStore';

interface ConsistencyComparisonProps {
  user: CompareUser;
  friend: CompareUser;
}

export function ConsistencyComparison({ user, friend }: ConsistencyComparisonProps) {
  const { selectedPlatform } = useUIStore();
  const uHeatmap = selectedPlatform === 'CODEFORCES'
    ? (user.cfHeatmapData?.length ? user.cfHeatmapData : user.heatmapData)
    : selectedPlatform === 'CODECHEF'
    ? (user.ccHeatmapData?.length ? user.ccHeatmapData : user.heatmapData)
    : selectedPlatform === 'LEETCODE'
    ? (user.lcHeatmapData?.length ? user.lcHeatmapData : user.heatmapData)
    : user.heatmapData;
  const fHeatmap = selectedPlatform === 'CODEFORCES'
    ? (friend.cfHeatmapData?.length ? friend.cfHeatmapData : friend.heatmapData)
    : selectedPlatform === 'CODECHEF'
    ? (friend.ccHeatmapData?.length ? friend.ccHeatmapData : friend.heatmapData)
    : selectedPlatform === 'LEETCODE'
    ? (friend.lcHeatmapData?.length ? friend.lcHeatmapData : friend.heatmapData)
    : friend.heatmapData;

  const uTotal = uHeatmap.reduce((acc, curr) => acc + curr.count, 0);
  const fTotal = fHeatmap.reduce((acc, curr) => acc + curr.count, 0);
  const uActive = uHeatmap.filter((d) => d.count > 0).length;
  const fActive = fHeatmap.filter((d) => d.count > 0).length;

  return (
    <Card padding="22px" className="gap-6">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Consistency</h3>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <HeatmapPanel title="You" accent="var(--accent-blue)" total={uTotal} active={uActive}>
          <ActivityHeatmap data={uHeatmap} accentColor="blue" compact />
        </HeatmapPanel>
        <HeatmapPanel title="Friend" accent="var(--accent-rose)" total={fTotal} active={fActive}>
          <ActivityHeatmap data={fHeatmap} accentColor="rose" compact />
        </HeatmapPanel>
      </div>
    </Card>
  );
}

function HeatmapPanel({ title, accent, total, active, children }: { title: string; accent: string; total: number; active: number; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: accent }}>{title}</span>
        <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span><strong className="font-mono-data" style={{ color: 'var(--text-primary)' }}>{total}</strong> submissions</span>
          <span><strong className="font-mono-data" style={{ color: 'var(--text-primary)' }}>{active}</strong> active days</span>
        </div>
      </div>
      {children}
    </div>
  );
}
