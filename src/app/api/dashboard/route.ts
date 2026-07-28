import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { USE_MOCK_DATA, MOCK_DASHBOARD } from '@/lib/mock';
import { fetchUpcomingContests, fetchContestSchedule, buildContestCalendarEvents, contestResultsToHistory, mergeRatingChartData } from '@/lib/contests/schedule';

// GET /api/dashboard
export async function GET() {
  if (USE_MOCK_DATA) return NextResponse.json(MOCK_DASHBOARD);

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      platforms: {
        include: { codeforcesData: true, leetcodeData: true },
      },
      streaks: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const cf = user.platforms.find((p) => p.platform === 'CODEFORCES');
  const lc = user.platforms.find((p) => p.platform === 'LEETCODE');

  const connectionIds = user.platforms.map((p) => p.id);

  const [recentSubmissions, heatmapSubs, contestRows, upcomingContests, contestSchedule] = await Promise.all([
    db.submission.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    }),
    db.submission.findMany({
      where: {
        connectionId: { in: connectionIds },
        verdict: { in: ['OK', 'Accepted', 'AC'] },
        timestamp: { gte: new Date(Date.now() - 365 * 86400000) },
      },
      select: { timestamp: true },
    }),
    db.contestResult.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: { timestamp: 'desc' },
      take: 20,
    }),
    fetchUpcomingContests(),
    fetchContestSchedule(),
  ]);

  const heatmapMap: Record<string, number> = {};
  for (const sub of heatmapSubs) {
    const day = sub.timestamp.toISOString().slice(0, 10);
    heatmapMap[day] = (heatmapMap[day] ?? 0) + 1;
  }
  const heatmapData = Object.entries(heatmapMap).map(([date, count]) => ({ date, count }));

  // Build merged rating history for chart
  const cfRatingHistory = (cf?.codeforcesData?.ratingHistory ?? []) as {
    date: string;
    rating: number;
    contestId: number;
  }[];

  const lcRatingHistory = (
    (lc?.leetcodeData?.streakData as { ratingHistory?: Array<{ startTime: number; rating: number }> } | null)
      ?.ratingHistory ?? []
  ).map((entry) => ({
    date: new Date(entry.startTime * 1000).toISOString(),
    rating: entry.rating,
  }));

  const ratingChartData = mergeRatingChartData(cfRatingHistory, lcRatingHistory);

  const contestHistory = contestResultsToHistory(
    contestRows.map((row) => {
      const ratingChange = row.ratingChange ?? 0;
      const after = row.newRating ?? 0;
      return {
        ...row,
        metadata: { oldRating: after - ratingChange },
      };
    }),
  );

  const attendedKeys = new Set(
    contestHistory.map((contest) => `${contest.platform}:${contest.date}:${contest.name}`),
  );
  const contestCalendarEvents = buildContestCalendarEvents(contestHistory, contestSchedule, attendedKeys);

  // Build topic stats (merged CF + LC tags)
  const cfTags = (cf?.codeforcesData?.tagStats ?? {}) as Record<string, number>;
  const lcTags = (lc?.leetcodeData?.tagStats ?? {}) as Record<string, number>;
  const allTags: Record<string, number> = { ...cfTags };
  for (const [tag, count] of Object.entries(lcTags)) {
    allTags[tag] = (allTags[tag] ?? 0) + count;
  }

  // Normalize to 0-100
  const maxCount = Math.max(...Object.values(allTags), 1);
  const topicStats = Object.entries(allTags)
    .map(([topic, rawCount]) => ({
      topic,
      rawCount,
      value: Math.round((rawCount / maxCount) * 100),
    }))
    .sort((a, b) => b.rawCount - a.rawCount)
    .slice(0, 8);

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
    platforms: {
      codeforces: cf
        ? {
            handle: cf.handle,
            syncStatus: cf.syncStatus,
            lastSyncedAt: cf.lastSyncedAt,
            syncError: cf.syncError,
            currentRating: cf.codeforcesData?.currentRating ?? null,
            maxRating: cf.codeforcesData?.maxRating ?? null,
            rank: cf.codeforcesData?.rank ?? null,
          }
        : null,
      leetcode: lc
        ? {
            handle: lc.handle,
            syncStatus: lc.syncStatus,
            lastSyncedAt: lc.lastSyncedAt,
            syncError: lc.syncError,
            totalSolved: lc.leetcodeData?.totalSolved ?? 0,
            easySolved: lc.leetcodeData?.easySolved ?? 0,
            mediumSolved: lc.leetcodeData?.mediumSolved ?? 0,
            hardSolved: lc.leetcodeData?.hardSolved ?? 0,
            contestRating: lc.leetcodeData?.contestRating ?? null,
          }
        : null,
    },
    streak: user.streaks
      ? {
          currentStreak: user.streaks.currentStreak,
          longestStreak: user.streaks.longestStreak,
          freezeTokens: user.streaks.freezeTokens,
          totalActiveDays: user.streaks.totalActiveDays,
        }
      : { currentStreak: 0, longestStreak: 0, freezeTokens: 2, totalActiveDays: 0 },
    heatmapData,
    ratingChartData,
    contestCalendarEvents,
    upcomingContests: upcomingContests.slice(0, 5),
    topicStats,
    recentSubmissions: recentSubmissions.map((s) => ({
      id: s.id,
      problemName: s.problemName,
      platform: s.platform,
      verdict: s.verdict,
      difficulty: s.difficulty,
      tags: s.tags,
      timestamp: s.timestamp.toISOString(),
    })),
  });
}
