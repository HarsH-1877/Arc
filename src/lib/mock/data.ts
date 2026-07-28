import type { CompareData } from '@/hooks/useCompareData';
import type { Friend, FriendRequest } from '@/hooks/useFriends';
import type { NotificationSummary } from '@/types';

export const MOCK_SESSION_USER = {
  id: 'mock-user-1',
  email: 'arc.dev@example.com',
  username: 'arcdev',
  displayName: 'Arc Developer',
  avatarUrl: null,
  onboarded: true,
};

export const MOCK_PROFILE = {
  id: MOCK_SESSION_USER.id,
  email: MOCK_SESSION_USER.email,
  username: MOCK_SESSION_USER.username,
  displayName: MOCK_SESSION_USER.displayName,
  avatarUrl: MOCK_SESSION_USER.avatarUrl,
  bio: 'Competitive programming enthusiast. CF + LC grind.',
  createdAt: new Date('2024-01-15').toISOString(),
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function genHeatmap(): { date: string; count: number }[] {
  const out: { date: string; count: number }[] = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.toISOString().slice(0, 10);
    const roll = Math.random();
    const count =
      roll > 0.72 ? 0 : roll > 0.55 ? 1 : roll > 0.35 ? 2 + Math.floor(Math.random() * 2) : roll > 0.15 ? 4 + Math.floor(Math.random() * 3) : 8 + Math.floor(Math.random() * 5);
    if (count > 0) out.push({ date: day, count });
  }
  return out;
}

function genRatingHistory(base: number, variance: number) {
  const points: { date: string; rating: number; contestId: number }[] = [];
  let rating = base;
  for (let i = 24; i >= 0; i--) {
    rating += Math.floor(Math.random() * variance * 2) - variance;
    points.push({
      date: daysAgo(i * 14),
      rating,
      contestId: 1000 + i,
    });
  }
  return points;
}

function ratingCurve(index: number, base: number, slope: number, amp: number, phase: number, dipIndex: number) {
  const wave = Math.sin(index / 2.2 + phase) * amp + Math.cos(index / 4.1 + phase) * (amp * 0.55);
  const dip = Math.max(0, 1 - Math.abs(index - dipIndex) / 3) * amp * 1.25;
  const rebound = Math.max(0, index - dipIndex - 1) * 3.4;
  return Math.round(base + index * slope + wave - dip + rebound);
}

function addFriendRatingLines(points: { date: string; cfRating: number; lcRating: number }[]) {
  return points.map((point, index) => ({
    ...point,
    cfRating: ratingCurve(index, 1400, 15, 300, 0.2, 9),
    lcRating: ratingCurve(index, 1750, 10, 200, 1.1, 14),
    friend1: ratingCurve(index, 2100, 8, 400, 0.4, 8),
    friend2: ratingCurve(index, 1200, 35, 200, 1.7, 12),
    friend3: ratingCurve(index, 1900, -10, 350, 2.4, 15),
    friend4: ratingCurve(index, 1500, 25, 100, 3.1, 10),
  }));
}

export const MOCK_DASHBOARD = {
  user: {
    id: MOCK_SESSION_USER.id,
    username: MOCK_SESSION_USER.username,
    displayName: MOCK_SESSION_USER.displayName,
    avatarUrl: MOCK_SESSION_USER.avatarUrl,
  },
  platforms: {
    codeforces: {
      handle: 'arcdev',
      syncStatus: 'SYNCED' as const,
      lastSyncedAt: daysAgo(0),
      syncError: null,
      currentRating: 1823,
      maxRating: 1912,
      rank: 'expert',
    },
    leetcode: {
      handle: 'arcdev',
      syncStatus: 'SYNCED' as const,
      lastSyncedAt: daysAgo(0),
      syncError: null,
      totalSolved: 347,
      easySolved: 112,
      mediumSolved: 198,
      hardSolved: 37,
      contestRating: 1847.5,
    },
  },
  streak: {
    currentStreak: 14,
    longestStreak: 42,
    freezeTokens: 2,
    totalActiveDays: 218,
  },
  heatmapData: genHeatmap(),
  ratingChartData: addFriendRatingLines(genRatingHistory(1750, 35).map((r, i) => ({
    date: r.date,
    cfRating: r.rating,
    lcRating: 1780 + i * 3 + Math.floor(Math.random() * 20),
  }))),
  topicStats: [
    { topic: 'dp', value: 100, rawCount: 45 },
    { topic: 'graphs', value: 78, rawCount: 35 },
    { topic: 'greedy', value: 65, rawCount: 29 },
    { topic: 'math', value: 52, rawCount: 23 },
    { topic: 'trees', value: 48, rawCount: 22 },
    { topic: 'binary search', value: 42, rawCount: 19 },
    { topic: 'two pointers', value: 38, rawCount: 17 },
    { topic: 'Dynamic Programming', value: 72, rawCount: 32 },
  ],
  recentSubmissions: [
    { id: 's1', problemName: 'Maximum Subarray', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'medium', tags: ['Array', 'DP'], timestamp: daysAgo(0) },
    { id: 's2', problemName: 'D. Matrix Cascade', platform: 'CODEFORCES' as const, verdict: 'OK', difficulty: null, tags: ['dp', 'math'], timestamp: daysAgo(1) },
    { id: 's3', problemName: 'Binary Tree Level Order', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'medium', tags: ['Tree', 'BFS'], timestamp: daysAgo(1) },
    { id: 's4', problemName: 'C. Competitive Programmer', platform: 'CODEFORCES' as const, verdict: 'OK', difficulty: null, tags: ['greedy'], timestamp: daysAgo(2) },
    { id: 's5', problemName: 'Merge k Sorted Lists', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'hard', tags: ['Heap', 'Linked List'], timestamp: daysAgo(3) },
    { id: 's6', problemName: 'B. Array Merge', platform: 'CODEFORCES' as const, verdict: 'WRONG_ANSWER', difficulty: null, tags: ['greedy'], timestamp: daysAgo(4) },
    { id: 's7', problemName: 'Valid Parentheses', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'easy', tags: ['Stack'], timestamp: daysAgo(5) },
    { id: 's8', problemName: 'A. Warm Up', platform: 'CODEFORCES' as const, verdict: 'OK', difficulty: null, tags: ['implementation'], timestamp: daysAgo(6) },
    { id: 's9', problemName: 'Course Schedule', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'medium', tags: ['Graph', 'Topological Sort'], timestamp: daysAgo(7) },
    { id: 's10', problemName: 'E. Graph Challenge', platform: 'CODEFORCES' as const, verdict: 'OK', difficulty: null, tags: ['graphs'], timestamp: daysAgo(8) },
  ],
  contestCalendarEvents: [
    { date: daysAgo(14).slice(0, 10), label: 'Codeforces Round 1034', platform: 'CODEFORCES' as const, type: 'given' as const, delta: 35 },
    { date: daysAgo(7).slice(0, 10), label: 'LeetCode Weekly Contest 456', platform: 'LEETCODE' as const, type: 'given' as const, delta: 29 },
    { date: daysAgo(3).slice(0, 10), label: 'Codeforces Round 1035', platform: 'CODEFORCES' as const, type: 'missed' as const },
  ],
  upcomingContests: [],
};

export const MOCK_FRIENDS: Friend[] = [
  { id: 'mock-friend-1', username: 'tourist', displayName: 'Gennady K.', avatarUrl: null, cfRating: 3821, lcRating: 3512, friendshipId: 'fr-1' },
  { id: 'mock-friend-2', username: 'benq', displayName: 'Benjamin Qi', avatarUrl: null, cfRating: 3790, lcRating: 3480, friendshipId: 'fr-2' },
  { id: 'mock-friend-3', username: 'ecnerwala', displayName: 'Andrew Gu', avatarUrl: null, cfRating: 3650, lcRating: 3200, friendshipId: 'fr-3' },
  { id: 'mock-friend-4', username: 'ksun48', displayName: 'Kevin Sun', avatarUrl: null, cfRating: 3100, lcRating: 2900, friendshipId: 'fr-4' },
  { id: 'mock-friend-5', username: 'neal', displayName: 'Neal Wu', avatarUrl: null, cfRating: 2840, lcRating: 2710, friendshipId: 'fr-5' },
];

export const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'req-1',
    type: 'INCOMING',
    createdAt: daysAgo(1),
    user: { id: 'mock-search-1', username: 'neal', displayName: 'Neal Wu', avatarUrl: null, cfRating: 2800, lcRating: 2650 },
  },
  {
    id: 'req-2',
    type: 'OUTGOING',
    createdAt: daysAgo(3),
    user: { id: 'mock-search-2', username: 'jiangly', displayName: 'Jiangly', avatarUrl: null, cfRating: 3200, lcRating: 3100 },
  },
];

export const MOCK_SEARCH_USERS: Friend[] = [
  { id: 'mock-search-3', username: 'petr', displayName: 'Petr Mitrichev', avatarUrl: null, cfRating: 3500, lcRating: 3400, relationship: 'NONE' },
  { id: 'mock-search-4', username: 'rng_58', displayName: 'rng_58', avatarUrl: null, cfRating: 3200, lcRating: 3000, relationship: 'NONE' },
];

export const MOCK_NOTIFICATIONS: NotificationSummary[] = [
  { id: 'n1', type: 'FRIEND_REQUEST', title: 'Friend request', body: 'neal wants to connect with you.', read: false, createdAt: daysAgo(0), metadata: { friendId: 'mock-search-1' } },
  { id: 'n2', type: 'RATING_CHANGE', title: 'Rating up!', body: 'Your Codeforces rating increased by 67 points.', read: false, createdAt: daysAgo(1), metadata: null },
  { id: 'n3', type: 'SYNC_COMPLETE', title: 'Sync complete', body: 'LeetCode data synced successfully.', read: true, createdAt: daysAgo(2), metadata: null },
  { id: 'n4', type: 'FRIEND_ACCEPTED', title: 'Friend accepted', body: 'benq accepted your friend request.', read: true, createdAt: daysAgo(4), metadata: null },
  { id: 'n5', type: 'SYNC_ERROR', title: 'Sync failed', body: 'Codeforces rate limit hit. Will retry.', read: true, createdAt: daysAgo(5), metadata: null },
];

export function getMockCompare(friendId: string): CompareData | null {
  const friend = MOCK_FRIENDS.find((f) => f.id === friendId);
  if (!friend) return null;

  const userHeatmap = MOCK_DASHBOARD.heatmapData;
  const friendHeatmap = genHeatmap().slice(0, 120);

  const userRatingHistory = genRatingHistory(1823, 40);
  const friendRatingHistory = genRatingHistory(friend.cfRating ?? 2000, 45);

  const userTopics = MOCK_DASHBOARD.topicStats;
  const friendTopics = userTopics.map((t) => ({
    ...t,
    rawCount: Math.max(1, t.rawCount - Math.floor(Math.random() * 15)),
    value: Math.max(10, t.value - Math.floor(Math.random() * 20)),
  }));

  return {
    user: {
      id: MOCK_SESSION_USER.id,
      username: MOCK_SESSION_USER.username,
      displayName: MOCK_SESSION_USER.displayName,
      avatarUrl: MOCK_SESSION_USER.avatarUrl,
      cfRating: 1823,
      cfRank: 'expert',
      lcRating: 1847.5,
      totalSolved: 347,
      streak: 14,
      totalActiveDays: userHeatmap.filter((d) => d.count > 0).length,
      lastSyncedAt: daysAgo(0),
      ratingHistory: userRatingHistory,
      topicStats: userTopics,
      heatmapData: userHeatmap,
    },
    friend: {
      id: friend.id,
      username: friend.username,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
      cfRating: friend.cfRating,
      cfRank: 'master',
      lcRating: friend.lcRating,
      totalSolved: 890 + Math.floor(Math.random() * 200),
      streak: 7 + Math.floor(Math.random() * 20),
      totalActiveDays: friendHeatmap.filter((d) => d.count > 0).length,
      lastSyncedAt: daysAgo(1),
      ratingHistory: friendRatingHistory,
      topicStats: friendTopics,
      heatmapData: friendHeatmap,
    },
    verdict: {
      totalSolved: 'friend',
      consistency: 'user',
      cfRating: friend.cfRating && friend.cfRating > 1823 ? 'friend' : 'user',
      lcRating: friend.lcRating && friend.lcRating > 1847 ? 'friend' : 'user',
      strongerTopics: {
        user: ['greedy', 'two pointers'],
        friend: ['dp', 'graphs', 'math'],
      },
    },
  };
}
