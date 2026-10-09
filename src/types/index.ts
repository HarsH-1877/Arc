export interface ApiError {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  onboarded: boolean;
  createdAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  freezeTokens: number;
  totalActiveDays: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface TopicStat {
  topic: string;
  count: number;
  normalized: number;
}

export interface RatingPoint {
  date: string;
  rating: number;
  platform: 'CODEFORCES' | 'LEETCODE' | 'CODECHEF';
}

export type CompareWinner = 'user' | 'friend' | 'tie';

export interface CompareVerdict {
  totalSolved: CompareWinner;
  consistency: CompareWinner;
  cfRating: CompareWinner;
  lcRating: CompareWinner;
  ccRating?: CompareWinner;
  strongerTopics: {
    user: string[];
    friend: string[];
  };
}

export interface DashboardData {
  profile: UserProfile;
  codeforces: CodeforcesDataSummary | null;
  leetcode: LeetcodeDataSummary | null;
  codechef?: CodechefDataSummary | null;
  streak: StreakData;
  heatmapData: HeatmapDay[];
  recentSubmissions: SubmissionSummary[];
  ratingHistory: RatingPoint[];
  topicStats: TopicStat[];
  lastSyncedAt: string | null;
}

export interface CodeforcesDataSummary {
  currentRating: number | null;
  maxRating: number | null;
  rank: string | null;
  tagStats: Record<string, number>;
  ratingHistory: Array<{ contestId: number; rating: number; date: string }>;
}

export interface LeetcodeDataSummary {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  contestRating: number | null;
  tagStats: Record<string, number>;
}

export interface CodechefDataSummary {
  currentRating: number | null;
  maxRating: number | null;
  stars: string | null;
  globalRank: number | null;
  countryRank: number | null;
  totalSolved: number;
  tagStats: Record<string, number>;
  ratingHistory: Array<{ contestId: string; rating: number; date: string }>;
}

export interface SubmissionSummary {
  id: string;
  problemName: string;
  platform: 'CODEFORCES' | 'LEETCODE' | 'CODECHEF';
  verdict: string;
  difficulty: string | null;
  tags: string[];
  timestamp: string;
}

export interface FriendSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
  cfRating: number | null;
  lcRating: number | null;
  ccRating?: number | null;
}

export interface FriendRequestSummary {
  id: string;
  sender: FriendSummary;
  receiver: FriendSummary;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface CompareData {
  user: DashboardData;
  friend: DashboardData;
  verdict: CompareVerdict;
}

export interface NotificationSummary {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}
