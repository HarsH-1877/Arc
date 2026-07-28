export type ContestPlatform = 'CODEFORCES' | 'LEETCODE';

export interface UpcomingContest {
  id: string;
  name: string;
  platform: ContestPlatform;
  startTime: string;
  durationSeconds: number;
  href: string;
}

export interface UserContestHistoryItem {
  id: string;
  name: string;
  platform: ContestPlatform;
  date: string;
  time: string;
  before: number;
  after: number;
  ratingChange: number;
  rank: number | null;
  solved: number;
  total: number;
  href: string;
}

export interface ContestCalendarEvent {
  date: string;
  label: string;
  platform: ContestPlatform;
  type: 'given' | 'upcoming' | 'missed';
  delta?: number;
  contestId?: string;
}
