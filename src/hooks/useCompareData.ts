import { useQuery } from '@tanstack/react-query';
import type { CompareVerdict } from '@/types';

export interface CompareUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  cfHandle?: string | null;
  lcHandle?: string | null;
  cfRating: number | null;
  cfMaxRating: number | null;
  cfRank: string | null;
  lcRating: number | null;
  lcMaxRating: number | null;
  totalSolved: number;
  cfSolvedCount: number;
  lcSolvedCount: number;
  cfContestCount: number;
  cfAverageRank: number | null;
  lcContestCount: number;
  lcAverageRank: number | null;
  streak: number;
  totalActiveDays: number;
  lastSyncedAt: string | null;
  ratingHistory: { date: string; rating: number; contestId?: number }[];
  cfRatingHistory?: { date: string; rating: number; contestId?: number }[];
  lcRatingHistory?: { date: string; rating: number; contestId?: number }[];
  topicStats: { topic: string; rawCount: number; value: number }[];
  cfTopicStats?: { topic: string; rawCount: number; value: number }[];
  lcTopicStats?: { topic: string; rawCount: number; value: number }[];
  heatmapData: { date: string; count: number }[];
  cfHeatmapData?: { date: string; count: number }[];
  lcHeatmapData?: { date: string; count: number }[];
}

export interface CompareData {
  user: CompareUser;
  friend: CompareUser;
  verdict: CompareVerdict;
}

export function useCompareData(friendId?: string | null, external?: { platform: 'CODEFORCES' | 'LEETCODE'; handle: string } | null) {
  return useQuery<CompareData>({
    queryKey: ['compare', friendId, external],
    queryFn: async () => {
      if (external) {
        const [selfResponse, externalResponse] = await Promise.all([
          fetch('/api/compare/self'),
          fetch(`/api/compare/external?platform=${external.platform}&handle=${encodeURIComponent(external.handle)}`),
        ]);
        if (!selfResponse.ok || !externalResponse.ok) {
          const body = await externalResponse.json().catch(() => ({}));
          throw new Error(body.error?.message ?? 'Could not fetch that platform user');
        }
        const self = await selfResponse.json() as CompareData;
        const friend = await externalResponse.json() as CompareUser;
        const winner = (a: number | null | undefined, b: number | null | undefined) => (a ?? 0) === (b ?? 0) ? 'tie' as const : (a ?? 0) > (b ?? 0) ? 'user' as const : 'friend' as const;
        return {
          user: self.user,
          friend,
          verdict: {
            totalSolved: winner(self.user.totalSolved, friend.totalSolved),
            consistency: winner(self.user.totalActiveDays, friend.totalActiveDays),
            cfRating: winner(self.user.cfRating, friend.cfRating),
            lcRating: winner(self.user.lcRating, friend.lcRating),
            strongerTopics: { user: [], friend: [] },
          },
        };
      }
      if (!friendId) throw new Error('No opponent selected');
      const res = await fetch(`/api/compare/${friendId}`);
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error?.message ?? 'Failed to fetch compare data'); }
      return res.json();
    },
    enabled: !!friendId || !!external,
  });
}
