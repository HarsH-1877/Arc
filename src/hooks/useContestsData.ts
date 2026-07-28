'use client';

import { useQuery } from '@tanstack/react-query';

export interface ContestItem {
  id: string;
  name: string;
  platform: 'CODEFORCES' | 'LEETCODE';
  date: string;
  time: string;
  before: number;
  after: number;
  ratingChange?: number;
  solved: number;
  total: number;
  href: string;
}

interface ContestsApiData {
  history: ContestItem[];
  upcoming: ContestItem[];
  bestByPlatform: ContestItem[];
}

async function fetchContests(): Promise<ContestsApiData> {
  const res = await fetch('/api/contests');
  if (!res.ok) throw new Error('Failed to fetch contest data');
  return res.json();
}

export function useContestsData() {
  return useQuery<ContestsApiData>({
    queryKey: ['contests'],
    queryFn: fetchContests,
    staleTime: 5 * 60 * 1000,
  });
}
