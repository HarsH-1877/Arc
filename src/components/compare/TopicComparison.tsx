'use client';

import { useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/shared/Card';
import type { CompareUser } from '@/hooks/useCompareData';
import { Check } from 'lucide-react';

interface TopicComparisonProps {
  user: CompareUser;
  friend: CompareUser;
}

interface TopicRow {
  topic: string;
  uStat: number;
  fStat: number;
  max: number;
}

export function TopicComparison({ user, friend }: TopicComparisonProps) {
  const rows = useMemo<TopicRow[]>(() => {
    const allTopics = new Set([...user.topicStats.map((t) => t.topic), ...friend.topicStats.map((t) => t.topic)]);
    return Array.from(allTopics).map((topic) => {
      const uStat = user.topicStats.find((t) => t.topic === topic)?.rawCount ?? 0;
      const fStat = friend.topicStats.find((t) => t.topic === topic)?.rawCount ?? 0;
      return { topic, uStat, fStat, max: Math.max(uStat, fStat, 1) };
    }).sort((a, b) => Math.max(b.uStat, b.fStat) - Math.max(a.uStat, a.fStat));
  }, [user.topicStats, friend.topicStats]);

  const [selectedTopics, setSelectedTopics] = useState(() => rows.slice(0, Math.min(6, Math.max(3, rows.length))).map((row) => row.topic));

  const selectedRows = rows.filter((row) => selectedTopics.includes(row.topic)).slice(0, 6);
  const chartData = selectedRows.map((row) => ({
    topic: row.topic.length > 14 ? row.topic.slice(0, 12) + '...' : row.topic,
    fullTopic: row.topic,
    you: row.uStat,
    friend: row.fStat,
  }));

  const toggleTopic = (topic: string) => {
    setSelectedTopics((current) => {
      if (current.includes(topic)) {
        if (current.length <= 3) return current;
        return current.filter((item) => item !== topic);
      }
      if (current.length >= 6) return current;
      return [...current, topic];
    });
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card padding="20px" className="min-h-[420px] gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Topic Web Graph</h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Overlapping solved-count profile for selected topics.</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><i className="h-2 w-2 rounded-full" style={{ background: 'var(--accent-blue)' }} />You</span>
            <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><i className="h-2 w-2 rounded-full" style={{ background: 'var(--accent-amber)' }} />Friend</span>
          </div>
        </div>

        <div className="min-h-0 flex-1" style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 16, right: 48, bottom: 16, left: 48 }}>
              <PolarGrid stroke="var(--border-default)" radialLines />
              <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TopicTooltip />} />
              <Radar name="You" dataKey="you" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.18} strokeWidth={2.5} />
              <Radar name="Friend" dataKey="friend" stroke="var(--accent-amber)" fill="var(--accent-amber)" fillOpacity={0.16} strokeWidth={2.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card padding="18px" className="gap-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Topics</h3>
              <span className="font-mono-data rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: selectedTopics.length < 3 ? 'rgba(244,63,94,0.1)' : 'var(--accent-blue-dim)', color: selectedTopics.length < 3 ? 'var(--accent-rose)' : 'var(--accent-blue)' }}>{selectedTopics.length}/6</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Select 3 to 6 topics to compare.
            </p>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pb-4 pr-1 no-scrollbar">
            {rows.map((row) => {
              const checked = selectedTopics.includes(row.topic);
              const disabled = checked ? selectedTopics.length <= 3 : selectedTopics.length >= 6;
              const total = Math.max(row.uStat + row.fStat, 1);
              
              return (
                <button
                  key={row.topic}
                  type="button"
                  disabled={disabled && !checked}
                  onClick={() => toggleTopic(row.topic)}
                  className="group flex flex-col justify-between cursor-pointer rounded-xl p-2.5 text-left transition-all active:scale-[0.97] disabled:cursor-not-allowed hover:bg-white/[0.03]"
                  style={{
                    background: checked ? 'var(--accent-blue-dim)' : 'transparent',
                    border: checked ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                    opacity: (disabled && !checked) ? 0.5 : 1,
                  }}
                >
                  <div className="flex w-full items-center gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors" style={{ background: checked ? 'var(--accent-blue)' : 'var(--bg-elevated)', color: checked ? '#fff' : 'var(--text-secondary)' }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="truncate text-xs font-semibold" style={{ color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {row.topic}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-mono-data text-[10px] font-bold" style={{ color: 'var(--accent-blue)' }}>{row.uStat}</span>
                    <div className="flex h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="h-full transition-all duration-500" style={{ width: `${(row.uStat / total) * 100}%`, background: 'var(--accent-blue)' }} />
                      <div className="h-full transition-all duration-500" style={{ width: `${(row.fStat / total) * 100}%`, background: 'var(--accent-amber)' }} />
                    </div>
                    <span className="font-mono-data text-[10px] font-bold" style={{ color: 'var(--accent-amber)' }}>{row.fStat}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
        </div>
      </Card>
    </div>
  );
}

function TopicTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{row?.fullTopic ?? row?.topic}</p>
      {payload.map((item: any) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
          <span className="font-mono-data font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
