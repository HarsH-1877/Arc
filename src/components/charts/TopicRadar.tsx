'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

export interface TopicStat {
  topic: string;
  value: number; // 0-100 normalized
  rawCount: number;
}

interface TopicRadarProps {
  data: TopicStat[];
  // For compare mode — show two overlapping radars
  compareData?: TopicStat[];
  primaryColor?: string;
  compareColor?: string;
  loading?: boolean;
  maxTopics?: number;
}

export function TopicRadar({
  data,
  compareData,
  primaryColor = 'var(--accent-primary)',
  compareColor = 'var(--accent-cyan)',
  loading,
  maxTopics = 8,
}: TopicRadarProps) {
  if (loading) {
    return (
      <div className="animate-pulse flex items-center justify-center h-48">
        <div className="h-40 w-40 rounded-full" style={{ background: 'var(--bg-surface-3)' }} />
      </div>
    );
  }

  const top = data.slice(0, maxTopics);

  if (!top.length) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No topic data yet</p>
      </div>
    );
  }

  // Merge primary + compare data on same topic axis
  const chartData = top.map((t) => {
    const comparePoint = compareData?.find((c) => c.topic === t.topic);
    return {
      topic: t.topic.length > 12 ? t.topic.slice(0, 10) + '…' : t.topic,
      primary: t.value,
      compare: comparePoint?.value ?? 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="var(--border-subtle)" gridType="polygon" />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-inter)' }}
        />
        <Radar
          name="You"
          dataKey="primary"
          stroke={primaryColor}
          fill={primaryColor}
          fillOpacity={0.25}
          strokeWidth={2}
        />
        {compareData && (
          <Radar
            name="Friend"
            dataKey="compare"
            stroke={compareColor}
            fill={compareColor}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
