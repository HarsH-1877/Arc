import { useQuery } from '@tanstack/react-query';

export interface ProblemItem {
  id: string;
  externalId: string;
  problemName: string;
  problemSlug: string | null;
  platform: 'CODEFORCES' | 'LEETCODE';
  verdict: string;
  language: string;
  timestamp: string;
  contestId: string | null;
  difficulty: string | null;
  tags: string[];
}

export interface ProblemsApiResponse {
  items: ProblemItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProblemsStatsApiResponse {
  totalAttempts: number;
  totalAccepted: number;
  acceptanceRate: number;
  topicWeakness: Array<{ topic: string; accuracy: number; score: number; solved: number }>;
  languageBreakdown: Array<{ lang: string; count: number }>;
}

export function useProblemsList(params: {
  platform: string;
  verdict: string;
  difficulty: string;
  tags: string[];
  lang: string;
  page: number;
}) {
  return useQuery<ProblemsApiResponse>({
    queryKey: ['problems', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params.platform !== 'ALL') sp.set('platform', params.platform);
      if (params.verdict !== 'All') sp.set('verdict', params.verdict);
      if (params.difficulty !== 'All') sp.set('difficulty', params.difficulty);
      if (params.lang !== 'All') sp.set('lang', params.lang);
      sp.set('page', params.page.toString());
      params.tags.forEach(t => sp.append('tag', t));

      const res = await fetch(`/api/problems?${sp.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch problems');
      return res.json();
    },
  });
}

export function useProblemsStats(platform: string) {
  return useQuery<ProblemsStatsApiResponse>({
    queryKey: ['problems-stats', platform],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (platform !== 'ALL') sp.set('platform', platform);

      const res = await fetch(`/api/problems/stats?${sp.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });
}
