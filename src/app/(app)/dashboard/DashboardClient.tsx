'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { HeroStats } from '@/components/dashboard/HeroStats';
import { ProblemLog } from '@/components/dashboard/ProblemLog';
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap';
import { RatingChart } from '@/components/charts/RatingChart';
import { TopicBreakdown } from '@/components/dashboard/TopicBreakdown';
import { EmptyState } from '@/components/shared/EmptyState';
import { Link as LinkIcon } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { FriendsLeaderboard } from '@/components/dashboard/FriendsLeaderboard';

export function DashboardClient() {
  const { data, isLoading } = useDashboardData();

  const cf = data?.platforms.codeforces;
  const lc = data?.platforms.leetcode;
  const noPlatforms = !cf && !lc && !isLoading;

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden">
      {noPlatforms && (
        <Card variant="base" padding="32px">
          <EmptyState icon={<LinkIcon size={48} />} title="No platforms connected" description="Connect your Codeforces or LeetCode account to see your stats." action={{ label: 'Connect in Settings', href: '/settings/connections' }} />
        </Card>
      )}

      {!noPlatforms && (
        <>
          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <RatingChart data={data?.ratingChartData ?? []} loading={isLoading} compact />
            </div>
            <div className="min-w-0">
              <FriendsLeaderboard compact />
            </div>
          </div>

          <HeroStats data={data} loading={isLoading} />

          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4">
              <Card variant="base" padding="18px">
                <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', display: 'block' }}>
                  Activity Heatmap
                </span>
                <ActivityHeatmap data={data?.heatmapData ?? []} loading={isLoading} compact />
              </Card>

              <Card variant="base" padding="18px">
                <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', display: 'block' }}>
                  Recent Problems
                </span>
                <ProblemLog submissions={data?.recentSubmissions ?? []} loading={isLoading} />
              </Card>
            </div>

            <div className="min-w-0">
              <TopicBreakdown topics={data?.topicStats ?? []} loading={isLoading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
