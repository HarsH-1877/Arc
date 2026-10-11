import type { CompareData } from '@/hooks/useCompareData';
import type { Friend, FriendRequest } from '@/hooks/useFriends';
import type { NotificationSummary } from '@/types';
import type { UserContestHistoryItem } from '@/lib/contests/types';

export const MOCK_SESSION_USER = {
  id: 'mock-user-1',
  email: 'arc.dev@example.com',
  username: 'arcdev',
  avatarUrl: null,
  onboarded: true,
};

export const MOCK_PROFILE = {
  id: MOCK_SESSION_USER.id,
  email: MOCK_SESSION_USER.email,
  username: MOCK_SESSION_USER.username,
  avatarUrl: MOCK_SESSION_USER.avatarUrl,
  bio: 'Competitive programming enthusiast. CF + LC + CC grind.',
  createdAt: new Date('2024-01-15').toISOString(),
  connectedPlatforms: ['CODEFORCES', 'LEETCODE', 'CODECHEF'],
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

function addFriendRatingLines(points: { date: string; cfRating: number; lcRating: number; ccRating?: number }[]) {
  return points.map((point, index) => ({
    ...point,
    cfRating: ratingCurve(index, 1400, 15, 300, 0.2, 9),
    lcRating: ratingCurve(index, 1750, 10, 200, 1.1, 14),
    ccRating: ratingCurve(index, 1600, 14, 180, 0.7, 11),
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
      contestCount: 45,
      totalSolved: 850,
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
      contestCount: 30,
    },
    codechef: {
      handle: 'arcdev',
      syncStatus: 'SYNCED' as const,
      lastSyncedAt: daysAgo(0),
      syncError: null,
      currentRating: 1945,
      maxRating: 2010,
      stars: '4★',
      globalRank: 1240,
      countryRank: 310,
      contestCount: 24,
      totalSolved: 420,
    },
  },
  streak: {
    currentStreak: 14,
    longestStreak: 42,
    freezeTokens: 2,
    totalActiveDays: 218,
  },
  heatmapData: genHeatmap(),
  codeforcesHeatmapData: genHeatmap().filter((_, i) => i % 2 === 0),
  leetcodeHeatmapData: genHeatmap().filter((_, i) => i % 3 === 0),
  codechefHeatmapData: genHeatmap().filter((_, i) => i % 4 === 0),
  ratingChartData: addFriendRatingLines(genRatingHistory(1750, 35).map((r, i) => ({
    date: r.date,
    cfRating: r.rating,
    lcRating: 1780 + i * 3 + Math.floor(Math.random() * 20),
    ccRating: 1800 + i * 5 + Math.floor(Math.random() * 20),
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
  codeforcesTopicStats: [
    { topic: 'dp', value: 100, rawCount: 45 },
    { topic: 'graphs', value: 78, rawCount: 35 },
    { topic: 'greedy', value: 65, rawCount: 29 },
    { topic: 'math', value: 52, rawCount: 23 },
    { topic: 'trees', value: 48, rawCount: 22 },
  ],
  leetcodeTopicStats: [
    { topic: 'Arrays', value: 100, rawCount: 120 },
    { topic: 'String', value: 80, rawCount: 96 },
    { topic: 'Hash Table', value: 65, rawCount: 78 },
    { topic: 'Dynamic Programming', value: 50, rawCount: 60 },
  ],
  codechefTopicStats: [
    { topic: 'basic-programming', value: 100, rawCount: 150 },
    { topic: 'sorting', value: 85, rawCount: 80 },
    { topic: 'greedy', value: 70, rawCount: 65 },
    { topic: 'math', value: 55, rawCount: 45 },
  ],
  recentSubmissions: [
    { id: 's1', problemName: 'Maximum Subarray', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'medium', tags: ['Array', 'DP'], timestamp: daysAgo(0) },
    { id: 's2', problemName: 'D. Matrix Cascade', platform: 'CODEFORCES' as const, verdict: 'OK', difficulty: null, tags: ['dp', 'math'], timestamp: daysAgo(1) },
    { id: 's3', problemName: 'Chef and Reversing', platform: 'CODECHEF' as const, verdict: 'Accepted', difficulty: 'medium', tags: ['Graph', 'BFS'], timestamp: daysAgo(1) },
    { id: 's4', problemName: 'Binary Tree Level Order', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'medium', tags: ['Tree', 'BFS'], timestamp: daysAgo(2) },
    { id: 's5', problemName: 'C. Competitive Programmer', platform: 'CODEFORCES' as const, verdict: 'OK', difficulty: null, tags: ['greedy'], timestamp: daysAgo(2) },
    { id: 's6', problemName: 'Distinct Pairs', platform: 'CODECHEF' as const, verdict: 'Accepted', difficulty: 'easy', tags: ['greedy'], timestamp: daysAgo(3) },
    { id: 's7', problemName: 'Merge k Sorted Lists', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'hard', tags: ['Heap', 'Linked List'], timestamp: daysAgo(4) },
    { id: 's8', problemName: 'B. Array Merge', platform: 'CODEFORCES' as const, verdict: 'WRONG_ANSWER', difficulty: null, tags: ['greedy'], timestamp: daysAgo(4) },
    { id: 's9', problemName: 'Valid Parentheses', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'easy', tags: ['Stack'], timestamp: daysAgo(5) },
    { id: 's10', problemName: 'A. Warm Up', platform: 'CODEFORCES' as const, verdict: 'OK', difficulty: null, tags: ['implementation'], timestamp: daysAgo(6) },
    { id: 's11', problemName: 'Course Schedule', platform: 'LEETCODE' as const, verdict: 'Accepted', difficulty: 'medium', tags: ['Graph', 'Topological Sort'], timestamp: daysAgo(7) },
    { id: 's12', problemName: 'E. Graph Challenge', platform: 'CODEFORCES' as const, verdict: 'OK', difficulty: null, tags: ['graphs'], timestamp: daysAgo(8) },
  ],
  contestCalendarEvents: [
    { date: daysAgo(14).slice(0, 10), label: 'Codeforces Round 1034', platform: 'CODEFORCES' as const, type: 'given' as const, delta: 35 },
    { date: daysAgo(10).slice(0, 10), label: 'Starters 155 (Div 2)', platform: 'CODECHEF' as const, type: 'given' as const, delta: 45 },
    { date: daysAgo(7).slice(0, 10), label: 'LeetCode Weekly Contest 456', platform: 'LEETCODE' as const, type: 'given' as const, delta: 29 },
    { date: daysAgo(3).slice(0, 10), label: 'Codeforces Round 1035', platform: 'CODEFORCES' as const, type: 'missed' as const },
  ],
  upcomingContests: [],
};

export const MOCK_CONTEST_HISTORY: UserContestHistoryItem[] = [
  {
    id: 'cf-round-1034',
    name: 'Codeforces Round 1034 (Div. 2)',
    platform: 'CODEFORCES',
    date: daysAgo(3).slice(0, 10),
    time: '17:35',
    startTime: `${daysAgo(3).slice(0, 10)}T17:35:00.000Z`,
    before: 1780,
    after: 1823,
    ratingChange: 43,
    rank: 412,
    solved: 4,
    total: 6,
    href: 'https://codeforces.com/contest/2065',
  },
  {
    id: 'lc-weekly-456',
    name: 'LeetCode Weekly Contest 456',
    platform: 'LEETCODE',
    date: daysAgo(7).slice(0, 10),
    time: '02:30',
    startTime: `${daysAgo(7).slice(0, 10)}T02:30:00.000Z`,
    before: 2390,
    after: 2450,
    ratingChange: 60,
    rank: 218,
    solved: 4,
    total: 4,
    href: 'https://leetcode.com/contest/weekly-contest-456',
  },
  {
    id: 'cc-starters-155',
    name: 'CodeChef Starters 155 (Div 2)',
    platform: 'CODECHEF',
    date: daysAgo(10).slice(0, 10),
    time: '14:30',
    startTime: `${daysAgo(10).slice(0, 10)}T14:30:00.000Z`,
    before: 1890,
    after: 1945,
    ratingChange: 55,
    rank: 180,
    solved: 5,
    total: 6,
    href: 'https://www.codechef.com/START155B',
  },
  {
    id: 'lc-biweekly-159',
    name: 'LeetCode Biweekly Contest 159',
    platform: 'LEETCODE',
    date: daysAgo(14).slice(0, 10),
    time: '14:30',
    startTime: `${daysAgo(14).slice(0, 10)}T14:30:00.000Z`,
    before: 2345,
    after: 2390,
    ratingChange: 45,
    rank: 285,
    solved: 4,
    total: 4,
    href: 'https://leetcode.com/contest/biweekly-contest-159',
  },
  {
    id: 'cf-educational-171',
    name: 'Educational Codeforces Round 171',
    platform: 'CODEFORCES',
    date: daysAgo(18).slice(0, 10),
    time: '17:35',
    startTime: `${daysAgo(18).slice(0, 10)}T17:35:00.000Z`,
    before: 1735,
    after: 1780,
    ratingChange: 45,
    rank: 530,
    solved: 4,
    total: 6,
    href: 'https://codeforces.com/contest/2060',
  },
  {
    id: 'lc-weekly-454',
    name: 'LeetCode Weekly Contest 454',
    platform: 'LEETCODE',
    date: daysAgo(21).slice(0, 10),
    time: '02:30',
    startTime: `${daysAgo(21).slice(0, 10)}T02:30:00.000Z`,
    before: 2360,
    after: 2345,
    ratingChange: -15,
    rank: 640,
    solved: 3,
    total: 4,
    href: 'https://leetcode.com/contest/weekly-contest-454',
  },
  {
    id: 'cc-starters-153',
    name: 'CodeChef Starters 153 (Div 2)',
    platform: 'CODECHEF',
    date: daysAgo(24).slice(0, 10),
    time: '14:30',
    startTime: `${daysAgo(24).slice(0, 10)}T14:30:00.000Z`,
    before: 1840,
    after: 1890,
    ratingChange: 50,
    rank: 210,
    solved: 5,
    total: 6,
    href: 'https://www.codechef.com/START153B',
  },
  {
    id: 'lc-weekly-453',
    name: 'LeetCode Weekly Contest 453',
    platform: 'LEETCODE',
    date: daysAgo(28).slice(0, 10),
    time: '02:30',
    startTime: `${daysAgo(28).slice(0, 10)}T02:30:00.000Z`,
    before: 2300,
    after: 2360,
    ratingChange: 60,
    rank: 195,
    solved: 4,
    total: 4,
    href: 'https://leetcode.com/contest/weekly-contest-453',
  },
  {
    id: 'cf-round-1030',
    name: 'Codeforces Round 1030 (Div. 2)',
    platform: 'CODEFORCES',
    date: daysAgo(32).slice(0, 10),
    time: '17:35',
    startTime: `${daysAgo(32).slice(0, 10)}T17:35:00.000Z`,
    before: 1750,
    after: 1735,
    ratingChange: -15,
    rank: 1120,
    solved: 3,
    total: 6,
    href: 'https://codeforces.com/contest/2057',
  },
  {
    id: 'cc-starters-151',
    name: 'CodeChef Starters 151 (Div 2)',
    platform: 'CODECHEF',
    date: daysAgo(38).slice(0, 10),
    time: '14:30',
    startTime: `${daysAgo(38).slice(0, 10)}T14:30:00.000Z`,
    before: 1860,
    after: 1840,
    ratingChange: -20,
    rank: 490,
    solved: 3,
    total: 6,
    href: 'https://www.codechef.com/START151B',
  },
  {
    id: 'cf-round-1028',
    name: 'Codeforces Round 1028 (Div. 2)',
    platform: 'CODEFORCES',
    date: daysAgo(46).slice(0, 10),
    time: '17:35',
    startTime: `${daysAgo(46).slice(0, 10)}T17:35:00.000Z`,
    before: 1680,
    after: 1750,
    ratingChange: 70,
    rank: 295,
    solved: 5,
    total: 6,
    href: 'https://codeforces.com/contest/2053',
  },
  {
    id: 'cc-starters-149',
    name: 'CodeChef Starters 149 (Div 2)',
    platform: 'CODECHEF',
    date: daysAgo(52).slice(0, 10),
    time: '14:30',
    startTime: `${daysAgo(52).slice(0, 10)}T14:30:00.000Z`,
    before: 1790,
    after: 1860,
    ratingChange: 70,
    rank: 145,
    solved: 6,
    total: 6,
    href: 'https://www.codechef.com/START149B',
  },
];

export const MOCK_FRIENDS: Friend[] = [
  { id: 'mock-friend-1', username: 'tourist', avatarUrl: null, cfRating: 3821, lcRating: 3512, ccRating: 3100, friendshipId: 'fr-1' },
  { id: 'mock-friend-2', username: 'benq', avatarUrl: null, cfRating: 3790, lcRating: 3480, ccRating: 2950, friendshipId: 'fr-2' },
  { id: 'mock-friend-3', username: 'ecnerwala', avatarUrl: null, cfRating: 3650, lcRating: 3200, ccRating: 2820, friendshipId: 'fr-3' },
  { id: 'mock-friend-4', username: 'ksun48', avatarUrl: null, cfRating: 3100, lcRating: 2900, ccRating: 2600, friendshipId: 'fr-4' },
  { id: 'mock-friend-5', username: 'neal', avatarUrl: null, cfRating: 2840, lcRating: 2710, ccRating: 2450, friendshipId: 'fr-5' },
];

export const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'req-1',
    type: 'INCOMING',
    createdAt: daysAgo(1),
    user: { id: 'mock-search-1', username: 'neal', avatarUrl: null, cfRating: 2800, lcRating: 2650, ccRating: 2400 },
  },
  {
    id: 'req-2',
    type: 'OUTGOING',
    createdAt: daysAgo(3),
    user: { id: 'mock-search-2', username: 'jiangly', avatarUrl: null, cfRating: 3200, lcRating: 3100, ccRating: 2850 },
  },
];

export const MOCK_SEARCH_USERS: Friend[] = [
  { id: 'mock-search-3', username: 'petr', avatarUrl: null, cfRating: 3500, lcRating: 3400, ccRating: 2900, relationship: 'NONE' },
  { id: 'mock-search-4', username: 'rng_58', avatarUrl: null, cfRating: 3200, lcRating: 3000, ccRating: 2750, relationship: 'NONE' },
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
  const userCfHeatmap = userHeatmap.filter((_, i) => i % 2 === 0);
  const userLcHeatmap = userHeatmap.filter((_, i) => i % 3 === 0);
  const userCcHeatmap = userHeatmap.filter((_, i) => i % 4 === 0);

  const friendHeatmap = genHeatmap().slice(0, 120);
  const friendCfHeatmap = friendHeatmap.filter((_, i) => i % 2 === 0);
  const friendLcHeatmap = friendHeatmap.filter((_, i) => i % 3 !== 0);
  const friendCcHeatmap = friendHeatmap.filter((_, i) => i % 4 !== 0);

  const userRatingHistory = genRatingHistory(1823, 40);
  const userLcRatingHistory = genRatingHistory(2450, 30);
  const userCcRatingHistory = genRatingHistory(1945, 30);
  const friendRatingHistory = genRatingHistory(friend.cfRating ?? 2000, 45);
  const friendLcRatingHistory = genRatingHistory(friend.lcRating ?? 2200, 35);
  const friendCcRatingHistory = genRatingHistory(friend.ccRating ?? 1850, 35);

  const userTopics = MOCK_DASHBOARD.topicStats;
  const userCfTopics = [
    { topic: 'dp', value: 100, rawCount: 45 },
    { topic: 'graphs', value: 78, rawCount: 35 },
    { topic: 'greedy', value: 65, rawCount: 29 },
    { topic: 'math', value: 52, rawCount: 23 },
    { topic: 'trees', value: 48, rawCount: 22 },
    { topic: 'binary search', value: 42, rawCount: 19 },
  ];
  const userLcTopics = [
    { topic: 'Arrays', value: 100, rawCount: 120 },
    { topic: 'String', value: 80, rawCount: 96 },
    { topic: 'Hash Table', value: 65, rawCount: 78 },
    { topic: 'Dynamic Programming', value: 50, rawCount: 60 },
    { topic: 'Two Pointers', value: 40, rawCount: 48 },
    { topic: 'Sliding Window', value: 35, rawCount: 42 },
  ];
  const userCcTopics = [
    { topic: 'basic-programming', value: 100, rawCount: 150 },
    { topic: 'sorting', value: 85, rawCount: 80 },
    { topic: 'greedy', value: 70, rawCount: 65 },
    { topic: 'math', value: 55, rawCount: 45 },
  ];

  const friendTopics = userTopics.map((t) => ({
    ...t,
    rawCount: Math.max(1, t.rawCount - Math.floor(Math.random() * 15)),
    value: Math.max(10, t.value - Math.floor(Math.random() * 20)),
  }));
  const friendCfTopics = userCfTopics.map((t) => ({
    ...t,
    rawCount: Math.max(1, t.rawCount - Math.floor(Math.random() * 10)),
    value: Math.max(10, t.value - Math.floor(Math.random() * 15)),
  }));
  const friendLcTopics = userLcTopics.map((t) => ({
    ...t,
    rawCount: Math.max(1, t.rawCount - Math.floor(Math.random() * 20)),
    value: Math.max(10, t.value - Math.floor(Math.random() * 25)),
  }));
  const friendCcTopics = userCcTopics.map((t) => ({
    ...t,
    rawCount: Math.max(1, t.rawCount - Math.floor(Math.random() * 15)),
    value: Math.max(10, t.value - Math.floor(Math.random() * 20)),
  }));

  return {
    user: {
      id: MOCK_SESSION_USER.id,
      username: MOCK_SESSION_USER.username,
      avatarUrl: MOCK_SESSION_USER.avatarUrl,
      cfHandle: 'arcdev',
      cfRating: 1823,
      cfMaxRating: 1912,
      cfRank: 'Master',
      lcHandle: 'arcdev',
      lcRating: 2450,
      lcMaxRating: 2518,
      ccHandle: 'arcdev',
      ccRating: 1945,
      ccMaxRating: 2010,
      ccStars: '4★',
      totalSolved: 1670,
      cfSolvedCount: 850,
      lcSolvedCount: 1250,
      ccSolvedCount: 420,
      cfContestCount: 45,
      cfAverageRank: 684,
      lcContestCount: 30,
      lcAverageRank: 421,
      ccContestCount: 24,
      ccAverageRank: 310,
      streak: 42,
      totalActiveDays: userHeatmap.filter((d) => d.count > 0).length,
      lastSyncedAt: daysAgo(0),
      ratingHistory: userRatingHistory,
      cfRatingHistory: userRatingHistory,
      lcRatingHistory: userLcRatingHistory,
      ccRatingHistory: userCcRatingHistory,
      topicStats: userTopics,
      cfTopicStats: userCfTopics,
      lcTopicStats: userLcTopics,
      ccTopicStats: userCcTopics,
      heatmapData: userHeatmap,
      cfHeatmapData: userCfHeatmap,
      lcHeatmapData: userLcHeatmap,
      ccHeatmapData: userCcHeatmap,
    },
    friend: {
      id: friend.id,
      username: friend.username,
      avatarUrl: friend.avatarUrl,
      cfHandle: friend.username,
      cfRating: friend.cfRating,
      cfMaxRating: friend.cfRating ? friend.cfRating + 74 : null,
      cfRank: 'master',
      lcHandle: friend.username,
      lcRating: friend.lcRating,
      lcMaxRating: friend.lcRating ? friend.lcRating + 52 : null,
      ccHandle: friend.username,
      ccRating: friend.ccRating ?? 1850,
      ccMaxRating: (friend.ccRating ?? 1850) + 60,
      ccStars: '4★',
      totalSolved: 1270 + Math.floor(Math.random() * 200),
      cfSolvedCount: 500,
      lcSolvedCount: 390,
      ccSolvedCount: 380,
      cfContestCount: 30,
      cfAverageRank: 802,
      lcContestCount: 20,
      lcAverageRank: 516,
      ccContestCount: 20,
      ccAverageRank: 450,
      streak: 7 + Math.floor(Math.random() * 20),
      totalActiveDays: friendHeatmap.filter((d) => d.count > 0).length,
      lastSyncedAt: daysAgo(1),
      ratingHistory: friendRatingHistory,
      cfRatingHistory: friendRatingHistory,
      lcRatingHistory: friendLcRatingHistory,
      ccRatingHistory: friendCcRatingHistory,
      topicStats: friendTopics,
      cfTopicStats: friendCfTopics,
      lcTopicStats: friendLcTopics,
      ccTopicStats: friendCcTopics,
      heatmapData: friendHeatmap,
      cfHeatmapData: friendCfHeatmap,
      lcHeatmapData: friendLcHeatmap,
      ccHeatmapData: friendCcHeatmap,
    },
    verdict: {
      totalSolved: 'friend',
      consistency: 'user',
      cfRating: friend.cfRating && friend.cfRating > 1823 ? 'friend' : 'user',
      lcRating: friend.lcRating && friend.lcRating > 1847 ? 'friend' : 'user',
      ccRating: (friend.ccRating ?? 1850) > 1945 ? 'friend' : (friend.ccRating ?? 1850) === 1945 ? 'tie' : 'user',
      strongerTopics: {
        user: ['greedy', 'two pointers'],
        friend: ['dp', 'graphs', 'math'],
      },
    },
  };
}
