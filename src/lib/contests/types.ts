export type ContestPlatform = 'CODEFORCES' | 'LEETCODE' | 'CODECHEF';

export interface UpcomingContest {
  id: string;
  name: string;
  platform: ContestPlatform;
  startTime: string;
  durationSeconds: number;
  href: string;
  registrationOpen?: boolean;
}

export interface UserContestHistoryItem {
  id: string;
  name: string;
  platform: ContestPlatform;
  date: string;
  time: string;
  startTime?: string;
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
  /** Exact ISO start time; date remains the calendar grouping key. */
  startTime?: string;
  label: string;
  platform: ContestPlatform;
  type: 'given' | 'upcoming' | 'missed';
  delta?: number;
  contestId?: string;
  href?: string;
  registrationOpen?: boolean;
}
