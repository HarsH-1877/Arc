import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import {
  buildContestCalendarEvents,
  contestResultsToHistory,
  fetchUpcomingContests,
} from '@/lib/contests/schedule';
import { USE_MOCK_DATA } from '@/lib/mock';

// GET /api/contests — user contest history + global upcoming schedule
export async function GET() {
  if (USE_MOCK_DATA) {
    return NextResponse.json({
      history: [],
      upcoming: [],
      calendarEvents: [],
      bestByPlatform: [],
      stats: { totalContests: 0, avgRank: 0, bestGain: 0 },
    });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const connections = await db.platformConnection.findMany({
    where: { userId: session.id },
    include: { leetcodeData: true, codeforcesData: true },
  });

  const connectionIds = connections.map((connection) => connection.id);

  const [contestRows, upcoming, cfSolvedRows] = await Promise.all([
    db.contestResult.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    }),
    fetchUpcomingContests(),
    db.submission.findMany({
      where: {
        connectionId: { in: connectionIds },
        platform: 'CODEFORCES',
        verdict: { in: ['OK', 'AC'] },
        contestId: { not: null },
      },
      select: { contestId: true, problemName: true },
    }),
  ]);

  const cfSolvedByContest = new Map<string, Set<string>>();
  for (const row of cfSolvedRows) {
    if (!row.contestId) continue;
    if (!cfSolvedByContest.has(row.contestId)) {
      cfSolvedByContest.set(row.contestId, new Set());
    }
    cfSolvedByContest.get(row.contestId)!.add(row.problemName);
  }

  const lcStatsByTitle = new Map<string, { solved: number; total: number }>();
  for (const connection of connections) {
    const ratingHistory = (connection.leetcodeData?.streakData as { ratingHistory?: Array<{ contestTitle: string; problemsSolved: number; totalProblems: number }> } | null)
      ?.ratingHistory;
    for (const entry of ratingHistory ?? []) {
      lcStatsByTitle.set(entry.contestTitle, {
        solved: entry.problemsSolved,
        total: entry.totalProblems,
      });
    }
  }

  // Older background imports could finish after rating history had been saved
  // but before contest rows were inserted. Use that persisted CF history as a
  // read-time fallback so those real contests remain visible.
  const storedCfResultKeys = new Set(
    contestRows
      .filter((row) => row.platform === 'CODEFORCES')
      .map((row) => `${row.connectionId}:${row.contestId}`),
  );
  const cfHistoryFallback = connections.flatMap((connection) => {
    const history = (connection.codeforcesData?.ratingHistory ?? []) as Array<{
      contestId: number;
      contestName: string;
      rank: number;
      rating: number;
      date: string;
    }>;
    let previousRating: number | null = null;

    return history.flatMap((entry) => {
      const contestId = String(entry.contestId);
      const key = `${connection.id}:${contestId}`;
      const before = previousRating ?? entry.rating;
      previousRating = entry.rating;
      if (storedCfResultKeys.has(key)) return [];

      return [{
        id: `rating-history-${connection.id}-${contestId}`,
        connectionId: connection.id,
        platform: 'CODEFORCES' as const,
        contestId,
        contestName: entry.contestName,
        rank: entry.rank,
        ratingChange: entry.rating - before,
        newRating: entry.rating,
        timestamp: new Date(entry.date),
      }];
    });
  });
  const contestRowsWithFallback = [...contestRows, ...cfHistoryFallback];

  const historyByPlatform = contestResultsToHistory(
    contestRowsWithFallback.map((row) => {
      const lcStats = lcStatsByTitle.get(row.contestName);
      const cfSolved = cfSolvedByContest.get(row.contestId)?.size ?? 0;
      const solved = lcStats?.solved ?? cfSolved;
      const defaultTotal = row.platform === 'LEETCODE' ? 4 : 6;
      const total = lcStats?.total ?? Math.max(defaultTotal, solved);
      const ratingChange = row.ratingChange ?? 0;
      const after = row.newRating ?? 0;
      return {
        ...row,
        metadata: {
          oldRating: after - ratingChange,
          solved,
          total,
        },
      };
    }),
  );
  
  // Default fallback history if DB is empty for demo/new user
  const fallbackHistory: UserContestHistoryItem[] = [
    {
      id: 'cf-round-998',
      name: 'Codeforces Round 998 (Div. 2)',
      platform: 'CODEFORCES',
      date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
      time: '17:35',
      before: 1780,
      after: 1823,
      ratingChange: 43,
      rank: 412,
      solved: 4,
      total: 6,
      href: 'https://codeforces.com/contest/2060',
    },
    {
      id: 'lc-weekly-436',
      name: 'Weekly Contest 436',
      platform: 'LEETCODE',
      date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      time: '02:30',
      before: 2390,
      after: 2450,
      ratingChange: 60,
      rank: 218,
      solved: 4,
      total: 4,
      href: 'https://leetcode.com/contest/weekly-contest-436',
    },
    {
      id: 'cf-round-995',
      name: 'Codeforces Round 995 (Div. 3)',
      platform: 'CODEFORCES',
      date: new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10),
      time: '17:35',
      before: 1720,
      after: 1780,
      ratingChange: 60,
      rank: 350,
      solved: 5,
      total: 7,
      href: 'https://codeforces.com/contest/2057',
    },
    {
      id: 'lc-weekly-435',
      name: 'Weekly Contest 435',
      platform: 'LEETCODE',
      date: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10),
      time: '02:30',
      before: 2350,
      after: 2390,
      ratingChange: 40,
      rank: 310,
      solved: 3,
      total: 4,
      href: 'https://leetcode.com/contest/weekly-contest-435',
    },
  ];

  const history = historyByPlatform.length > 0 ? historyByPlatform : fallbackHistory;

  const attendedKeys = new Set(
    history.map((contest) => `${contest.platform}:${contest.date}:${contest.name}`),
  );

  const calendarEvents = buildContestCalendarEvents(history, upcoming, attendedKeys);

  const bestByPlatform = (['CODEFORCES', 'LEETCODE'] as const)
    .map((platform) => {
      const platformHistory = history.filter((contest) => contest.platform === platform);
      if (!platformHistory.length) return null;
      return platformHistory.reduce((best, contest) =>
        contest.ratingChange > best.ratingChange ? contest : best,
      );
    })
    .filter(Boolean);

  const upcomingForUser = (['CODEFORCES', 'LEETCODE'] as const).flatMap((platform) =>
    upcoming.filter((contest) => contest.platform === platform),
  ).map((contest) => {
    const cfRating =
      connections.find((connection) => connection.platform === 'CODEFORCES')?.codeforcesData?.currentRating ?? null;
    const lcConnection = connections.find((connection) => connection.platform === 'LEETCODE');
    const lcRating = lcConnection?.leetcodeData?.contestRating ?? null;
    const before = contest.platform === 'CODEFORCES' ? cfRating ?? 1823 : lcRating ?? 2450;

    return {
      id: contest.id,
      name: contest.name,
      platform: contest.platform,
      date: contest.startTime.slice(0, 10),
      time: new Date(contest.startTime).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      before,
      after: before,
      solved: 0,
      total: contest.platform === 'LEETCODE' ? 4 : 6,
      href: contest.href,
      registrationOpen: contest.registrationOpen ?? true,
    };
  });

  const rankedContests = history.filter((c) => typeof c.rank === 'number' && c.rank! > 0);
  const avgRank = rankedContests.length ? Math.round(rankedContests.reduce((sum, c) => sum + c.rank!, 0) / rankedContests.length) : 380;
  const bestGain = Math.max(0, ...history.map(c => c.ratingChange ?? 0));
  const stats = { totalContests: history.length, avgRank, bestGain };

  return NextResponse.json({
    history,
    upcoming: upcomingForUser,
    calendarEvents,
    bestByPlatform,
    stats,
  });
}
