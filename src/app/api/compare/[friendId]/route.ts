import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { logger } from '@/lib/utils';
import type { CompareWinner } from '@/types';
import type { Prisma } from '@prisma/client';
import { USE_MOCK_DATA, getMockCompare, MOCK_FRIENDS } from '@/lib/mock';
import { getStoredCodeforcesProblemKey } from '@/lib/codeforces/solved-problems';

type UserWithPlatforms = Prisma.UserGetPayload<{
  include: {
    platforms: { include: { codeforcesData: true; leetcodeData: true; codechefData: true } };
    streaks: true;
  };
}>;

function compareWinner(a: number | null | undefined, b: number | null | undefined): CompareWinner {
  const av = a ?? 0;
  const bv = b ?? 0;
  if (av > bv) return 'user';
  if (bv > av) return 'friend';
  return 'tie';
}

async function formatUser(
  u: UserWithPlatforms,
  heatmaps: {
    all: { date: string; count: number }[];
    cf: { date: string; count: number }[];
    lc: { date: string; count: number }[];
    cc: { date: string; count: number }[];
  }
) {
  const cf = u.platforms.find((p) => p.platform === 'CODEFORCES');
  const lc = u.platforms.find((p) => p.platform === 'LEETCODE');
  const cc = u.platforms.find((p) => p.platform === 'CODECHEF');

  const cfTags = (cf?.codeforcesData?.tagStats as Record<string, number>) ?? {};
  const lcTags = (lc?.leetcodeData?.tagStats as Record<string, number>) ?? {};
  const ccTags = (cc?.codechefData?.tagStats as Record<string, number>) ?? {};

  const topicStatsRaw: Record<string, number> = {
    ...cfTags,
    ...lcTags,
    ...ccTags,
  };

  const buildTopics = (tags: Record<string, number>) => {
    const maxCount = Math.max(...Object.values(tags), 1);
    return Object.entries(tags)
      .map(([topic, rawCount]) => ({
        topic,
        rawCount,
        value: Math.round((rawCount / maxCount) * 100),
      }))
      .sort((a, b) => b.rawCount - a.rawCount);
  };

  const topicStats = buildTopics(topicStatsRaw);
  const cfTopicStats = buildTopics(cfTags);
  const lcTopicStats = buildTopics(lcTags);
  const ccTopicStats = buildTopics(ccTags);

  const cfRatingHistory = (cf?.codeforcesData?.ratingHistory as Array<{ date: string; rating: number; contestId: number }>) ?? [];
  const ccRatingHistory = (cc?.codechefData?.ratingHistory as Array<{ date: string; rating: number; contestId?: any; name?: string }>) ?? [];
  const lcStreakData = lc?.leetcodeData?.streakData as { ratingHistory?: Array<{ startTime: number; rating: number }> } | null;
  const streakRatingHistory = lcStreakData?.ratingHistory ?? [];

  // 3-source fallback: streakData → ContestResult rows → live fetch
  let lcRatingHistory: Array<{ date: string; rating: number }> = [];
  if (streakRatingHistory.length > 0) {
    lcRatingHistory = streakRatingHistory.map((entry) => ({
      date: new Date(entry.startTime * 1000).toISOString(),
      rating: Math.round(entry.rating),
    }));
  } else if (lc) {
    const lcContestRows = await db.contestResult.findMany({
      where: { connectionId: lc.id, platform: 'LEETCODE' },
      orderBy: { timestamp: 'asc' },
    });
    if (lcContestRows.length > 0) {
      lcRatingHistory = lcContestRows
        .filter((row) => row.newRating != null)
        .map((row) => ({
          date: row.timestamp.toISOString(),
          rating: row.newRating!,
        }));
    } else {
      // Live fetch fallback + backfill
      try {
        const { getLCContestHistory } = await import('@/lib/fetchers/leetcode');
        const liveHistory = await getLCContestHistory(lc.handle);
        if (liveHistory.length > 0) {
          lcRatingHistory = liveHistory.map((entry) => ({
            date: new Date(entry.startTime * 1000).toISOString(),
            rating: entry.rating,
          }));
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
          for (let i = 0; i < liveHistory.length; i++) {
            const entry = liveHistory[i];
            const prevRating = liveHistory[i - 1]?.rating ?? entry.rating;
            const contestId = `${entry.startTime}-${entry.contestTitle.replace(/\s+/g, '-').slice(0, 48)}`;
            db.contestResult.upsert({
              where: { connectionId_contestId_platform: { connectionId: lc.id, contestId, platform: 'LEETCODE' } },
              create: {
                connectionId: lc.id, platform: 'LEETCODE', contestId,
                contestName: entry.contestTitle, rank: entry.ranking,
                ratingChange: entry.rating - prevRating, newRating: entry.rating,
                timestamp: new Date(entry.startTime * 1000),
              },
              update: { rank: entry.ranking, ratingChange: entry.rating - prevRating, newRating: entry.rating },
            }).catch(() => {});
          }
        }
      } catch { /* live fetch failed */ }
    }
  }

  const cfSubs = cf
    ? await db.submission.findMany({
        where: { connectionId: cf.id, verdict: { in: ['OK', 'AC', 'Accepted'] } },
        select: { problemName: true, problemSlug: true, contestId: true },
      })
    : [];
  const cfSolvedCount = new Set(
    cfSubs.map(getStoredCodeforcesProblemKey),
  ).size;
  const lcSolvedCount = lc?.leetcodeData?.totalSolved ?? 0;
  const ccSolvedCount = cc?.codechefData?.totalSolved ?? 0;
  const cfContestCount = cfRatingHistory.length;
  const lcContestCount = lc?.leetcodeData?.contestsAttended ?? 0;
  const ccContestCount = cc?.codechefData?.contestsAttended ?? ccRatingHistory.length;
  const contestRanks = await db.contestResult.findMany({
    where: { connectionId: { in: [cf?.id, lc?.id, cc?.id].filter((id): id is string => Boolean(id)) }, rank: { not: null } },
    select: { connectionId: true, rank: true },
  });
  const averageRankFor = (connectionId?: string) => {
    const ranks = contestRanks.filter((row) => row.connectionId === connectionId && row.rank && row.rank > 0).map((row) => row.rank!);
    return ranks.length ? Math.round(ranks.reduce((total, rank) => total + rank, 0) / ranks.length) : null;
  };
  const cfAverageRank = averageRankFor(cf?.id);
  const lcAverageRank = averageRankFor(lc?.id);
  const ccAverageRank = averageRankFor(cc?.id);
  const cfMaxRating = cf?.codeforcesData?.maxRating ?? null;
  const lcMaxRating = Math.max(lc?.leetcodeData?.contestRating ?? 0, ...lcRatingHistory.map((point) => point.rating)) || null;
  const ccMaxRating = cc?.codechefData?.maxRating ?? null;

  return {
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl,
    cfHandle: cf?.handle ?? null,
    lcHandle: lc?.handle ?? null,
    ccHandle: cc?.handle ?? null,
    cfRating: cf?.codeforcesData?.currentRating ?? null,
    cfMaxRating,
    cfRank: cf?.codeforcesData?.rank ?? null,
    lcRating: lc?.leetcodeData?.contestRating ?? null,
    lcMaxRating,
    ccRating: cc?.codechefData?.currentRating ?? null,
    ccMaxRating,
    ccStars: cc?.codechefData?.stars ?? null,
    totalSolved: cfSolvedCount + lcSolvedCount + ccSolvedCount,
    cfSolvedCount,
    lcSolvedCount,
    ccSolvedCount,
    cfContestCount,
    cfAverageRank,
    lcContestCount,
    lcAverageRank,
    ccContestCount,
    ccAverageRank,
    streak: u.streaks?.currentStreak ?? 0,
    totalActiveDays: heatmaps.all.filter((d) => d.count > 0).length,
    ratingHistory: cfRatingHistory,
    cfRatingHistory,
    lcRatingHistory,
    ccRatingHistory,
    topicStats,
    cfTopicStats,
    lcTopicStats,
    ccTopicStats,
    heatmapData: heatmaps.all,
    cfHeatmapData: heatmaps.cf,
    lcHeatmapData: heatmaps.lc,
    ccHeatmapData: heatmaps.cc,
    lastSyncedAt: cf?.lastSyncedAt?.toISOString() ?? lc?.lastSyncedAt?.toISOString() ?? cc?.lastSyncedAt?.toISOString() ?? null,
  };
}

function computeStrongerTopics(
  userTopics: Array<{ topic: string; rawCount: number }>,
  friendTopics: Array<{ topic: string; rawCount: number }>,
): { user: string[]; friend: string[] } {
  const friendMap = new Map(friendTopics.map((t) => [t.topic, t.rawCount]));
  const userMap = new Map(userTopics.map((t) => [t.topic, t.rawCount]));
  const allTopics = new Set([...Array.from(userMap.keys()), ...Array.from(friendMap.keys())]);

  const diffs: Array<{ topic: string; diff: number }> = [];
  for (const topic of Array.from(allTopics)) {
    diffs.push({ topic, diff: (userMap.get(topic) ?? 0) - (friendMap.get(topic) ?? 0) });
  }

  diffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  return {
    user: diffs.filter((d) => d.diff > 0).slice(0, 5).map((d) => d.topic),
    friend: diffs.filter((d) => d.diff < 0).slice(0, 5).map((d) => d.topic),
  };
}

export async function GET(_req: Request, { params }: { params: { friendId: string } }) {
  try {
    if (USE_MOCK_DATA) {
      const data = getMockCompare(params.friendId === 'self' ? MOCK_FRIENDS[0]?.id ?? '' : params.friendId);
      if (!data) {
        return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Friend not found' } }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } }, { status: 401 });
    }

    const friendId = params.friendId;
    if (!friendId) {
      return NextResponse.json({ error: { code: 'MISSING_FRIEND', message: 'friendId required' } }, { status: 400 });
    }

    const [user, friend] = await Promise.all([
      db.user.findUnique({
        where: { id: session.id },
        include: { platforms: { include: { codeforcesData: true, leetcodeData: true, codechefData: true } }, streaks: true },
      }),
      db.user.findUnique({
        where: { id: friendId === 'self' ? session.id : friendId },
        include: { platforms: { include: { codeforcesData: true, leetcodeData: true, codechefData: true } }, streaks: true },
      }),
    ]);

    if (!user || !friend) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const getHeatmapData = async (userId: string) => {
      const connections = await db.platformConnection.findMany({
        where: { userId },
        select: { id: true, platform: true },
      });
      const subs = await db.submission.findMany({
        where: {
          connectionId: { in: connections.map((c) => c.id) },
          timestamp: { gte: oneYearAgo },
        },
        select: { timestamp: true, connectionId: true },
      });

      const cfConnId = connections.find((c) => c.platform === 'CODEFORCES')?.id;
      const lcConnId = connections.find((c) => c.platform === 'LEETCODE')?.id;
      const ccConnId = connections.find((c) => c.platform === 'CODECHEF')?.id;

      const mapAll: Record<string, number> = {};
      const mapCf: Record<string, number> = {};
      const mapLc: Record<string, number> = {};
      const mapCc: Record<string, number> = {};

      for (const s of subs) {
        const day = s.timestamp.toISOString().slice(0, 10);
        mapAll[day] = (mapAll[day] ?? 0) + 1;
        if (s.connectionId === cfConnId) mapCf[day] = (mapCf[day] ?? 0) + 1;
        if (s.connectionId === lcConnId) mapLc[day] = (mapLc[day] ?? 0) + 1;
        if (s.connectionId === ccConnId) mapCc[day] = (mapCc[day] ?? 0) + 1;
      }
      return {
        all: Object.entries(mapAll).map(([date, count]) => ({ date, count })),
        cf: Object.entries(mapCf).map(([date, count]) => ({ date, count })),
        lc: Object.entries(mapLc).map(([date, count]) => ({ date, count })),
        cc: Object.entries(mapCc).map(([date, count]) => ({ date, count })),
      };
    };

    const [userHeatmap, friendHeatmap] = await Promise.all([
      getHeatmapData(user.id),
      getHeatmapData(friend.id),
    ]);

    const formattedUser = await formatUser(user, userHeatmap);
    const formattedFriend = await formatUser(friend, friendHeatmap);

    const verdict = {
      totalSolved: compareWinner(formattedUser.totalSolved, formattedFriend.totalSolved),
      consistency: compareWinner(formattedUser.totalActiveDays, formattedFriend.totalActiveDays),
      cfRating: compareWinner(formattedUser.cfRating, formattedFriend.cfRating),
      lcRating: compareWinner(formattedUser.lcRating, formattedFriend.lcRating),
      ccRating: compareWinner(formattedUser.ccRating, formattedFriend.ccRating),
      strongerTopics: computeStrongerTopics(formattedUser.topicStats, formattedFriend.topicStats),
    };

    return NextResponse.json({
      user: formattedUser,
      friend: formattedFriend,
      verdict,
    });
  } catch (err) {
    logger.error('[GET /api/compare]', err);
    return NextResponse.json({ error: { code: 'INTERNAL', message: 'Internal server error' } }, { status: 500 });
  }
}
