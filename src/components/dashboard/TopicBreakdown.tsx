'use client';

import { Card } from '@/components/shared/Card';

interface TopicStat {
  topic: string;
  count?: number;
  rawCount?: number;
  value?: number;
}

interface TopicBreakdownProps {
  topics?: TopicStat[];
  loading?: boolean;
}

function topicCount(topic: TopicStat) {
  return topic.count ?? topic.rawCount ?? topic.value ?? 0;
}

export function TopicBreakdown({ topics = [], loading = false }: TopicBreakdownProps) {
  if (loading) {
    return (
      <Card variant="base">
        <div className="flex flex-wrap gap-2">
          <div className="skeleton h-7 w-24 rounded-full" />
          <div className="skeleton h-7 w-28 rounded-full" />
          <div className="skeleton h-7 w-20 rounded-full" />
        </div>
      </Card>
    );
  }

  const sortedTopics = [...topics].sort((a, b) => topicCount(b) - topicCount(a));

  return (
    <Card variant="base">
      <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px' }}>
        Topics
      </span>
      {sortedTopics.length === 0 ? (
        <div className="flex h-20 items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
          No topics logged yet
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedTopics.map((t, index) => (
            <div key={t.topic} className="topic-pill">
              <span className="topic-name">{t.topic}</span>
              <span className={index < 3 ? 'topic-count topic-count-top font-mono-data' : 'topic-count font-mono-data'}>{topicCount(t)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
