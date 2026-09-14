'use client';

import { useQuery } from '@tanstack/react-query';

export interface DashboardApiData {
  user: { id: string; username: string; avatarUrl: string | null };
  platforms: {
    codeforces: {
      handle: string;
      syncStatus: string;
      lastSyncedAt: string | null;
      syncError: string | null;
      currentRating: number | null;
      maxRating: number | null;
      rank: string | null;
      contestCount: number;
      totalSolved?: number;
      difficultyStats?: Record<string, number>;
    } | null;
    leetcode: {
      handle: string;
      syncStatus: string;
      lastSyncedAt: string | null;
      syncError: string | null;
      totalSolved: number;
      easySolved: number;
      mediumSolved: number;
      hardSolved: number;
      contestRating: number | null;
      contestCount: number;
    } | null;
  };
  streak: { currentStreak: number; longestStreak: number; freezeTokens: number; totalActiveDays: number };
  heatmapData: { date: string; count: number }[];
  codeforcesHeatmapData?: { date: string; count: number }[];
  leetcodeHeatmapData?: { date: string; count: number }[];
  ratingChartData: { date: string; cfRating?: number; lcRating?: number; friend1?: number; friend2?: number; friend3?: number; friend4?: number }[];
  topicStats: { topic: string; value: number; rawCount: number }[];
  codeforcesTopicStats?: { topic: string; value: number; rawCount: number }[];
  leetcodeTopicStats?: { topic: string; value: number; rawCount: number }[];
  recentSubmissions: {
    id: string;
    problemName: string;
    platform: 'CODEFORCES' | 'LEETCODE';
    verdict: string;
    difficulty: string | null;
    tags: string[];
    timestamp: string;
  }[];
  contestCalendarEvents: Array<{
    date: string;
    startTime?: string;
    label: string;
    platform: 'CODEFORCES' | 'LEETCODE';
    type: 'given' | 'upcoming' | 'missed';
    delta?: number;
    contestId?: string;
    href?: string;
    registrationOpen?: boolean;
  }>;
  upcomingContests: Array<{
    id: string;
    name: string;
    platform: 'CODEFORCES' | 'LEETCODE';
    startTime: string;
    durationSeconds: number;
    href: string;
  }>;
}

async function fetchDashboard(): Promise<DashboardApiData> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export function useDashboardData() {
  return useQuery<DashboardApiData>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 2 * 60 * 1000,
  });
}
