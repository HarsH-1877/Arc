import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { USE_MOCK_DATA, MOCK_DASHBOARD } from '@/lib/mock';
import { fetchUpcomingContests, fetchContestSchedule, buildContestCalendarEvents, contestResultsToHistory, mergeRatingChartData } from '@/lib/contests/schedule';
import { getLCContestHistory } from '@/lib/fetchers/leetcode';
import { getStoredCodeforcesProblemKey } from '@/lib/codeforces/solved-problems';

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

  const [recentSubmissions, heatmapSubs, contestRows, upcomingContests, contestSchedule, cfAcceptedSubs] = await Promise.all([
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
      select: { timestamp: true, platform: true },
    }),
    db.contestResult.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: { timestamp: 'desc' },
      take: 200,
    }),
    fetchUpcomingContests(),
    fetchContestSchedule(),
    cf
      ? db.submission.findMany({
          where: {
            connectionId: cf.id,
            verdict: { in: ['OK', 'Accepted', 'AC'] },
          },
          select: { problemName: true, problemSlug: true, difficulty: true, contestId: true },
        })
      : Promise.resolve([]),
  ]);

  const cfSolvedCount = new Set(
    cfAcceptedSubs.map(getStoredCodeforcesProblemKey),
  ).size;

  const heatmapMaps: Record<'CODEFORCES' | 'LEETCODE', Record<string, number>> = {
    CODEFORCES: {},
    LEETCODE: {},
  };
  for (const sub of heatmapSubs) {
    const day = sub.timestamp.toISOString().slice(0, 10);
    heatmapMaps[sub.platform][day] = (heatmapMaps[sub.platform][day] ?? 0) + 1;
  }
  const codeforcesHeatmapData = Object.entries(heatmapMaps.CODEFORCES).map(([date, count]) => ({ date, count }));
  const leetcodeHeatmapData = Object.entries(heatmapMaps.LEETCODE).map(([date, count]) => ({ date, count }));

  // ── Build LC rating history ──────────────────────────────────────────────
  // Fallback chain (most to least preferred):
  //   1. streakData.ratingHistory  — written by full sync
  //   2. ContestResult DB rows     — written by every sync (including quick)
  //   3. Live LeetCode API fetch   — for users whose quick sync stored nothing
  //      (also backfills DB so this only happens once)

  const cfRatingHistory = (cf?.codeforcesData?.ratingHistory ?? []) as {
    date: string;
    rating: number;
    contestId: number;
  }[];

  const streakRatingHistory = (
    (lc?.leetcodeData?.streakData as { ratingHistory?: Array<{ startTime: number; rating: number }> } | null)
      ?.ratingHistory ?? []
  );

  let lcRatingHistory: Array<{ date: string; rating: number }> = [];

  if (streakRatingHistory.length > 0) {
    // Source 1: streakData
    lcRatingHistory = streakRatingHistory.map((entry) => ({
      date: new Date(entry.startTime * 1000).toISOString(),
      rating: Math.round(entry.rating),
    }));
  } else if (lc) {
    // Source 2: ContestResult rows (already fetched, just filter them)
    const lcContestRows = contestRows
      .filter((r) => r.connectionId === lc.id && r.platform === 'LEETCODE' && r.newRating != null)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (lcContestRows.length > 0) {
      lcRatingHistory = lcContestRows.map((row) => ({
        date: row.timestamp.toISOString(),
        rating: row.newRating!,
      }));
    } else {
      // Source 3: Live fetch + backfill DB so this only runs once
      try {
        const liveHistory = await getLCContestHistory(lc.handle);
        if (liveHistory.length > 0) {
          lcRatingHistory = liveHistory.map((entry) => ({
            date: new Date(entry.startTime * 1000).toISOString(),
            rating: entry.rating,
          }));

          // Backfill streakData (fire-and-forget — don't block response)
          const ratingHistoryPayload = liveHistory.map((entry, index) => {
            const prev = liveHistory[index - 1]?.rating ?? entry.rating;
            return {
              contestTitle: entry.contestTitle,
              startTime: entry.startTime,
              rating: entry.rating,
              ratingChange: entry.rating - prev,
              ranking: entry.ranking,
              problemsSolved: entry.problemsSolved,
              totalProblems: entry.totalProblems,
            };
          });
          db.leetcodeData.update({
            where: { connectionId: lc.id },
            data: { streakData: { ratingHistory: ratingHistoryPayload } },
          }).catch(() => {});

          // Backfill ContestResult rows (fire-and-forget)
          for (let i = 0; i < liveHistory.length; i++) {
            const entry = liveHistory[i];
            const prevRating = liveHistory[i - 1]?.rating ?? entry.rating;
            const contestId = `${entry.startTime}-${entry.contestTitle.replace(/\s+/g, '-').slice(0, 48)}`;
            db.contestResult.upsert({
              where: { connectionId_contestId_platform: { connectionId: lc.id, contestId, platform: 'LEETCODE' } },
              create: {
                connectionId: lc.id,
                platform: 'LEETCODE',
                contestId,
                contestName: entry.contestTitle,
                rank: entry.ranking,
                ratingChange: entry.rating - prevRating,
                newRating: entry.rating,
                timestamp: new Date(entry.startTime * 1000),
              },
              update: { rank: entry.ranking, ratingChange: entry.rating - prevRating, newRating: entry.rating },
            }).catch(() => {});
          }
        }
      } catch {
        // Live fetch failed — chart will show empty state with sync prompt
      }
    }
  }

  // ── Fetch top-4 friends' rating history for the dashboard chart ─────────
  // Store both CF and LC histories per friend so the chart can pick based on selectedPlatform
  let friendChartData: Array<{
    date: string;
    friend1?: number; friend2?: number; friend3?: number; friend4?: number;
    lcFriend1?: number; lcFriend2?: number; lcFriend3?: number; lcFriend4?: number;
  }> = [];
  try {
    const friendships = await db.friendship.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      take: 4,
      include: {
        userA: { include: { platforms: { include: { codeforcesData: true, leetcodeData: true } } } },
        userB: { include: { platforms: { include: { codeforcesData: true, leetcodeData: true } } } },
      },
    });

    const friendUsers = friendships
      .map((f) => (f.userAId === user.id ? f.userB : f.userA))
      .slice(0, 4);

    // For each friend, get BOTH CF and LC rating histories
    const cfFriendHistories: Array<Array<{ date: string; rating: number }>> = [];
    const lcFriendHistories: Array<Array<{ date: string; rating: number }>> = [];

    for (const friend of friendUsers) {
      const friendCf = friend.platforms.find((p) => p.platform === 'CODEFORCES');
      const friendLc = friend.platforms.find((p) => p.platform === 'LEETCODE');

      const cfHistory = (friendCf?.codeforcesData?.ratingHistory ?? []) as Array<{ date: string; rating: number }>;
      const lcStreakRaw = (friendLc?.leetcodeData?.streakData as { ratingHistory?: Array<{ startTime: number; rating: number }> } | null)?.ratingHistory ?? [];
      let lcHistory: Array<{ date: string; rating: number }> = lcStreakRaw.length > 0
        ? lcStreakRaw.map((e) => ({ date: new Date(e.startTime * 1000).toISOString(), rating: Math.round(e.rating) }))
        : [];

      if (lcHistory.length === 0 && friendLc) {
        const rows = await db.contestResult.findMany({
          where: { connectionId: friendLc.id, platform: 'LEETCODE', newRating: { not: null } },
          orderBy: { timestamp: 'asc' },
        });
        lcHistory = rows.map((r) => ({ date: r.timestamp.toISOString(), rating: r.newRating! }));
      }

      cfFriendHistories.push(cfHistory);
      lcFriendHistories.push(lcHistory);
    }

    // Collect all unique dates across user and all friends
    const baseData = mergeRatingChartData(cfRatingHistory, lcRatingHistory);
    const allDates = Array.from(new Set([
      ...baseData.map((d) => d.date.slice(0, 10)),
      ...cfFriendHistories.flatMap((h) => h.map((p) => p.date.slice(0, 10))),
      ...lcFriendHistories.flatMap((h) => h.map((p) => p.date.slice(0, 10))),
    ])).sort();

    // Build lookup maps for each friend (CF)
    const cfFriendMaps = cfFriendHistories.map((history) => {
      const m = new Map<string, number>();
      for (const p of history) m.set(p.date.slice(0, 10), p.rating);
      return m;
    });
    // Build lookup maps for each friend (LC)
    const lcFriendMaps = lcFriendHistories.map((history) => {
      const m = new Map<string, number>();
      for (const p of history) m.set(p.date.slice(0, 10), p.rating);
      return m;
    });

    const lastCfFriend = new Array(cfFriendHistories.length).fill(undefined) as Array<number | undefined>;
    const lastLcFriend = new Array(lcFriendHistories.length).fill(undefined) as Array<number | undefined>;
    const cfKeys = ['friend1', 'friend2', 'friend3', 'friend4'] as const;
    const lcKeys = ['lcFriend1', 'lcFriend2', 'lcFriend3', 'lcFriend4'] as const;

    friendChartData = allDates.map((date) => {
      const point: Record<string, number | string> = { date };
      for (let i = 0; i < cfFriendHistories.length; i++) {
        if (cfFriendMaps[i].has(date)) lastCfFriend[i] = cfFriendMaps[i].get(date);
        if (lastCfFriend[i] !== undefined) point[cfKeys[i]] = lastCfFriend[i]!;
      }
      for (let i = 0; i < lcFriendHistories.length; i++) {
        if (lcFriendMaps[i].has(date)) lastLcFriend[i] = lcFriendMaps[i].get(date);
        if (lastLcFriend[i] !== undefined) point[lcKeys[i]] = lastLcFriend[i]!;
      }
      return point as typeof friendChartData[number];
    });
  } catch {
    // Friend data is non-critical — fall through with empty array
  }

  const baseRatingData = mergeRatingChartData(cfRatingHistory, lcRatingHistory);

  // Merge friend data into the base rating chart data
  const friendDataMap = new Map(friendChartData.map((d) => [d.date, d]));
  const allDatesSet = new Set([
    ...baseRatingData.map((d) => d.date.slice(0, 10)),
    ...friendChartData.map((d) => d.date),
  ]);
  const allDatesSorted = Array.from(allDatesSet).sort();

  const baseMap = new Map(baseRatingData.map((d) => [d.date.slice(0, 10), d]));
  let lastCf: number | undefined;
  let lastLc: number | undefined;

  const ratingChartData = allDatesSorted.map((date) => {
    const base = baseMap.get(date);
    const friendPoint = friendDataMap.get(date);
    if (base?.cfRating !== undefined) lastCf = base.cfRating;
    if (base?.lcRating !== undefined) lastLc = base.lcRating;
    return {
      date,
      cfRating: lastCf,
      lcRating: lastLc,
      // CF friends (shown when selectedPlatform === 'CODEFORCES')
      friend1: friendPoint?.friend1,
      friend2: friendPoint?.friend2,
      friend3: friendPoint?.friend3,
      friend4: friendPoint?.friend4,
      // LC friends (shown when selectedPlatform === 'LEETCODE')
      lcFriend1: friendPoint?.lcFriend1,
      lcFriend2: friendPoint?.lcFriend2,
      lcFriend3: friendPoint?.lcFriend3,
      lcFriend4: friendPoint?.lcFriend4,
    };
  });


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

  const buildTopicStats = (tags: Record<string, number>) => {
    const maxCount = Math.max(...Object.values(tags), 1);
    return Object.entries(tags)
      .map(([topic, rawCount]) => ({
        topic,
        rawCount,
        value: Math.round((rawCount / maxCount) * 100),
      }))
      .sort((a, b) => b.rawCount - a.rawCount);
  };
  const topicStats = buildTopicStats(allTags);
  const codeforcesTopicStats = buildTopicStats(cfTags);
  const leetcodeTopicStats = buildTopicStats(lcTags);

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
            totalSolved: cfSolvedCount,
            difficultyStats: (cf.codeforcesData?.difficultyStats ?? {}) as Record<string, number>,
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
    heatmapData: codeforcesHeatmapData,
    codeforcesHeatmapData,
    leetcodeHeatmapData,
    ratingChartData,
    contestCalendarEvents,
    upcomingContests: upcomingContests.slice(0, 5),
    topicStats,
    codeforcesTopicStats,
    leetcodeTopicStats,
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
