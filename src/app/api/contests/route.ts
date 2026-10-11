import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import {
  buildContestCalendarEvents,
  contestResultsToHistory,
  fetchContestSchedule,
} from '@/lib/contests/schedule';
import type { UserContestHistoryItem } from '@/lib/contests/types';
import { USE_MOCK_DATA } from '@/lib/mock';
import { MOCK_CONTEST_HISTORY } from '@/lib/mock/data';

// GET /api/contests — user contest history + global upcoming schedule
export async function GET() {
  const session = await getSession();

  if (session?.isGuest || USE_MOCK_DATA) {
    const fullSchedule = await fetchContestSchedule().catch(() => []);
    const history = MOCK_CONTEST_HISTORY;
    const now = Date.now();
    const upcoming = fullSchedule
      .filter((c) => new Date(c.startTime).getTime() > now)
      .map((contest) => ({
        id: contest.id,
        name: contest.name,
        platform: contest.platform,
        date: contest.startTime.slice(0, 10),
        time: contest.startTime.slice(11, 16),
        startTime: contest.startTime,
        durationSeconds: contest.durationSeconds,
        before: contest.platform === 'CODEFORCES' ? 1823 : contest.platform === 'CODECHEF' ? 1945 : 2450,
        after: contest.platform === 'CODEFORCES' ? 1823 : contest.platform === 'CODECHEF' ? 1945 : 2450,
        solved: 0,
        total: contest.platform === 'LEETCODE' ? 4 : 6,
        href: contest.href,
        registrationOpen: contest.registrationOpen ?? true,
      }));

    const attendedKeys = new Set(
      history.map((contest) => `${contest.platform}:${contest.date}:${contest.name}`),
    );
    const calendarEvents = buildContestCalendarEvents(history, fullSchedule, attendedKeys);

    const bestByPlatform = (['CODEFORCES', 'LEETCODE', 'CODECHEF'] as const)
      .map((platform) => {
        const platformHistory = history.filter((contest) => contest.platform === platform);
        if (!platformHistory.length) return null;
        const withRank = platformHistory.filter((c) => typeof c.rank === 'number' && c.rank! > 0);
        if (withRank.length > 0) {
          return withRank.reduce((best, contest) => (contest.rank! < best.rank! ? contest : best));
        }
        return platformHistory.reduce((best, contest) =>
          contest.ratingChange > best.ratingChange ? contest : best,
        );
      })
      .filter(Boolean);

    const rankedContests = history.filter((c) => typeof c.rank === 'number' && c.rank! > 0);
    const avgRank = rankedContests.length
      ? Math.round(rankedContests.reduce((sum, c) => sum + c.rank!, 0) / rankedContests.length)
      : 0;
    const bestGain = Math.max(0, ...history.map((c) => c.ratingChange ?? 0));
    const stats = { totalContests: history.length, avgRank, bestGain };

    return NextResponse.json({
      history,
      upcoming,
      calendarEvents,
      bestByPlatform,
      stats,
    });
  }

  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const connections = await db.platformConnection.findMany({
    where: { userId: session.id },
    include: { leetcodeData: true, codeforcesData: true, codechefData: true },
  });

  const connectionIds = connections.map((connection) => connection.id);

  const [contestRows, fullSchedule, cfSolvedRows] = await Promise.all([
    db.contestResult.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    }),
    fetchContestSchedule(),
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
  const storedCcResultKeys = new Set(
    contestRows
      .filter((row) => row.platform === 'CODECHEF')
      .map((row) => `${row.connectionId}:${row.contestId}`),
  );
  const ccHistoryFallback = connections.flatMap((connection) => {
    const history = (connection.codechefData?.ratingHistory ?? []) as Array<{
      contestId: string;
      contestName: string;
      rank: number | null;
      rating?: number;
      newRating?: number;
      ratingChange?: number;
      oldRating?: number;
      date: string;
    }>;
    let prevRating: number | null = null;
    return history.flatMap((entry) => {
      const contestId = String(entry.contestId);
      const key = `${connection.id}:${contestId}`;
      const newRating = entry.newRating ?? entry.rating ?? 0;
      const change = entry.ratingChange ?? (prevRating != null ? newRating - prevRating : 0);
      prevRating = newRating;
      if (storedCcResultKeys.has(key)) return [];

      return [{
        id: `rating-history-${connection.id}-${contestId}`,
        connectionId: connection.id,
        platform: 'CODECHEF' as const,
        contestId,
        contestName: entry.contestName,
        rank: entry.rank,
        ratingChange: change,
        newRating,
        timestamp: new Date(entry.date),
      }];
    });
  });
  let contestRowsWithFallback = [...contestRows, ...cfHistoryFallback, ...ccHistoryFallback];

  // If no LC ContestResult rows exist in DB, live-fetch and backfill
  const hasLcRows = contestRowsWithFallback.some((r) => r.platform === 'LEETCODE');
  if (!hasLcRows) {
    const lcConnection = connections.find((c) => c.platform === 'LEETCODE');
    if (lcConnection) {
      try {
        const { getLCContestHistory } = await import('@/lib/fetchers/leetcode');
        const liveHistory = await getLCContestHistory(lcConnection.handle);
        for (let i = 0; i < liveHistory.length; i++) {
          const entry = liveHistory[i];
          const prevRating = liveHistory[i - 1]?.rating ?? entry.rating;
          const contestId = `${entry.startTime}-${entry.contestTitle.replace(/\s+/g, '-').slice(0, 48)}`;
          contestRowsWithFallback.push({
            id: `live-lc-${contestId}`,
            connectionId: lcConnection.id,
            platform: 'LEETCODE' as const,
            contestId,
            contestName: entry.contestTitle,
            rank: entry.ranking,
            ratingChange: entry.rating - prevRating,
            newRating: entry.rating,
            timestamp: new Date(entry.startTime * 1000),
          });
          // Backfill to DB (fire-and-forget)
          db.contestResult.upsert({
            where: { connectionId_contestId_platform: { connectionId: lcConnection.id, contestId, platform: 'LEETCODE' } },
            create: {
              connectionId: lcConnection.id, platform: 'LEETCODE', contestId,
              contestName: entry.contestTitle, rank: entry.ranking,
              ratingChange: entry.rating - prevRating, newRating: entry.rating,
              timestamp: new Date(entry.startTime * 1000),
            },
            update: { rank: entry.ranking, ratingChange: entry.rating - prevRating, newRating: entry.rating },
          }).catch(() => {});
        }
        // Also populate lcStatsByTitle from live data
        for (const entry of liveHistory) {
          lcStatsByTitle.set(entry.contestTitle, {
            solved: entry.problemsSolved,
            total: entry.totalProblems,
          });
        }
      } catch { /* live fetch failed */ }
    }
  }

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
  const fallbackHistory: UserContestHistoryItem[] = MOCK_CONTEST_HISTORY;

  const history = historyByPlatform.length > 0 ? historyByPlatform : fallbackHistory;

  const attendedKeys = new Set(
    history.map((contest) => `${contest.platform}:${contest.date}:${contest.name}`),
  );

  const upcoming = fullSchedule.filter((c) => new Date(c.startTime).getTime() > Date.now());
  const calendarEvents = buildContestCalendarEvents(history, fullSchedule, attendedKeys);

  const bestByPlatform = (['CODEFORCES', 'LEETCODE', 'CODECHEF'] as const)
    .map((platform) => {
      const platformHistory = history.filter((contest) => contest.platform === platform);
      if (!platformHistory.length) return null;
      // Best = lowest rank (rank 1 = best). Fall back to highest ratingChange if no rank data.
      const withRank = platformHistory.filter((c) => typeof c.rank === 'number' && c.rank! > 0);
      if (withRank.length > 0) {
        return withRank.reduce((best, contest) => (contest.rank! < best.rank! ? contest : best));
      }
      return platformHistory.reduce((best, contest) =>
        contest.ratingChange > best.ratingChange ? contest : best,
      );
    })
    .filter(Boolean);

  const now = Date.now();
  const upcomingForUser = (['CODEFORCES', 'LEETCODE', 'CODECHEF'] as const).flatMap((platform) =>
    upcoming.filter((contest) => {
      if (contest.platform !== platform) return false;
      if (new Date(contest.startTime).getTime() <= now) return false;
      return true;
    }),
  ).map((contest) => {
    const cfRating =
      connections.find((connection) => connection.platform === 'CODEFORCES')?.codeforcesData?.currentRating ?? null;
    const lcConnection = connections.find((connection) => connection.platform === 'LEETCODE');
    const lcRating = lcConnection?.leetcodeData?.contestRating ?? null;
    const ccConnection = connections.find((connection) => connection.platform === 'CODECHEF');
    const ccRating = ccConnection?.codechefData?.currentRating ?? null;
    const before = contest.platform === 'CODEFORCES' ? cfRating ?? 1823 : contest.platform === 'CODECHEF' ? ccRating ?? 1500 : lcRating ?? 2450;

    return {
      id: contest.id,
      name: contest.name,
      platform: contest.platform,
      date: contest.startTime.slice(0, 10),
      time: '',
      startTime: contest.startTime,
      before,
      after: before,
      solved: 0,
      total: contest.platform === 'LEETCODE' ? 4 : 6,
      href: contest.href,
      registrationOpen: contest.registrationOpen ?? true,
    };
  });

  const rankedContests = history.filter((c) => typeof c.rank === 'number' && c.rank! > 0);
  const avgRank = rankedContests.length ? Math.round(rankedContests.reduce((sum, c) => sum + c.rank!, 0) / rankedContests.length) : 0;
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
