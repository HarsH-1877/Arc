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
            <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><i className="h-2 w-2 rounded-full" style={{ background: 'var(--accent-purple)' }} />Friend</span>
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
              <Radar name="Friend" dataKey="friend" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.16} strokeWidth={2.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card padding="18px" className="gap-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Topics</h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Select 3 to 6 topics. Changes update the web graph instantly.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-md px-3 py-2" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Selected</span>
          <span className="font-mono-data text-xs font-bold" style={{ color: selectedTopics.length < 3 ? 'var(--accent-rose)' : 'var(--accent-blue)' }}>{selectedTopics.length}/6</span>
        </div>

        <div className="max-h-[310px] space-y-2 overflow-y-auto pr-1">
          {rows.map((row) => {
            const checked = selectedTopics.includes(row.topic);
            const disabled = checked ? selectedTopics.length <= 3 : selectedTopics.length >= 6;
            return (
              <button
                key={row.topic}
                type="button"
                disabled={disabled}
                onClick={() => toggleTopic(row.topic)}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left disabled:cursor-not-allowed"
                style={{
                  background: checked
                    ? 'linear-gradient(135deg, rgba(79,142,247,0.16), rgba(34,211,238,0.06))'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
                  border: checked ? '1px solid rgba(79,142,247,0.28)' : '1px solid var(--border-subtle)',
                  opacity: disabled && !checked ? 0.55 : 1,
                }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: checked ? 'var(--accent-blue)' : 'var(--bg-input)',
                    border: checked ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--border-default)',
                  }}
                >
                  {checked && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold" style={{ color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{row.topic}</span>
                  <span className="mt-0.5 block text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    You {row.uStat} / Friend {row.fStat}
                  </span>
                </span>
                <span
                  className="font-mono-data rounded-full px-2 py-1 text-[11px] font-semibold"
                  style={{ background: 'var(--bg-input)', color: checked ? 'var(--accent-blue)' : 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                >
                  {Math.max(row.uStat, row.fStat)}
                </span>
              </button>
            );
          })}
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
