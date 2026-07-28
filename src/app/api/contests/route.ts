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
      take: 40,
    }),
    fetchUpcomingContests(),
    db.submission.findMany({
      where: {
        connectionId: { in: connectionIds },
        platform: 'CODEFORCES',
        verdict: { in: ['OK', 'AC'] },
        contestId: { not: null },
      },
      select: { contestId: true },
    }),
  ]);

  const cfSolvedByContest = new Map<string, number>();
  for (const row of cfSolvedRows) {
    if (!row.contestId) continue;
    cfSolvedByContest.set(row.contestId, (cfSolvedByContest.get(row.contestId) ?? 0) + 1);
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

  const history = contestResultsToHistory(
    contestRows.map((row) => {
      const lcStats = lcStatsByTitle.get(row.contestName);
      const cfSolved = cfSolvedByContest.get(row.contestId);
      const ratingChange = row.ratingChange ?? 0;
      const after = row.newRating ?? 0;
      return {
        ...row,
        metadata: {
          oldRating: after - ratingChange,
          solved: lcStats?.solved ?? cfSolved ?? 0,
          total: lcStats?.total ?? (row.platform === 'LEETCODE' ? 4 : 7),
        },
      };
    }),
  ).slice(0, 10);

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

  const upcomingForUser = upcoming.slice(0, 6).map((contest) => {
    const cfRating =
      connections.find((connection) => connection.platform === 'CODEFORCES')?.codeforcesData?.currentRating ?? null;
    const lcConnection = connections.find((connection) => connection.platform === 'LEETCODE');
    const lcRating = lcConnection?.leetcodeData?.contestRating ?? null;
    const before = contest.platform === 'CODEFORCES' ? cfRating ?? 0 : lcRating ?? 0;

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
      total: contest.platform === 'LEETCODE' ? 4 : 7,
      href: contest.href,
    };
  });

  return NextResponse.json({
    history,
    upcoming: upcomingForUser,
    calendarEvents,
    bestByPlatform,
  });
}
