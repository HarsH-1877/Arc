import { useQuery } from '@tanstack/react-query';
import type { CompareVerdict } from '@/types';

export interface CompareUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  cfRating: number | null;
  cfRank: string | null;
  lcRating: number | null;
  totalSolved: number;
  cfSolvedCount: number;
  lcSolvedCount: number;
  cfContestCount: number;
  lcContestCount: number;
  streak: number;
  totalActiveDays: number;
  lastSyncedAt: string | null;
  ratingHistory: { date: string; rating: number; contestId: number }[];
  topicStats: { topic: string; rawCount: number; value: number }[];
  heatmapData: { date: string; count: number }[];
}

export interface CompareData {
  user: CompareUser;
  friend: CompareUser;
  verdict: CompareVerdict;
}

export function useCompareData(friendId?: string | null) {
  return useQuery<CompareData>({
    queryKey: ['compare', friendId],
    queryFn: async () => {
      if (!friendId) throw new Error('No friend selected');
      const res = await fetch(`/api/compare/${friendId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? 'Failed to fetch compare data');
      }
      return res.json();
    },
    enabled: !!friendId,
  });
}
