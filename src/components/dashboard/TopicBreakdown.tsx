'use client';

import { Card } from '@/components/shared/Card';
import { cn } from '@/lib/utils';

interface TopicStat {
  topic: string;
  count?: number;
  rawCount?: number;
  value?: number;
}

interface TopicBreakdownProps {
  topics?: TopicStat[];
  loading?: boolean;
  className?: string;
}

function topicCount(topic: TopicStat) {
  return topic.count ?? topic.rawCount ?? topic.value ?? 0;
}

export function TopicBreakdown({ topics = [], loading = false, className }: TopicBreakdownProps) {
  if (loading) {
    return (
      <Card variant="base" className={className}>
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
    <Card variant="base" className={cn('overflow-hidden', className)}>
      <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px' }}>
        Topics
      </span>
      {sortedTopics.length === 0 ? (
        <div className="flex h-20 items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
          No topics logged yet
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-wrap content-start gap-2">
            {sortedTopics.map((t, index) => (
              <div key={t.topic} className="topic-pill">
                <span className="topic-name">{t.topic}</span>
                <span className={index < 3 ? 'topic-count topic-count-top font-mono-data' : 'topic-count font-mono-data'}>{topicCount(t)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
