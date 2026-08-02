import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { logger } from '@/lib/utils';
import type { CompareWinner } from '@/types';
import type { Prisma } from '@prisma/client';
import { USE_MOCK_DATA, getMockCompare } from '@/lib/mock';

type UserWithPlatforms = Prisma.UserGetPayload<{
  include: {
    platforms: { include: { codeforcesData: true; leetcodeData: true } };
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

async function formatUser(u: UserWithPlatforms, heatmapData: { date: string; count: number }[]) {
  const cf = u.platforms.find((p) => p.platform === 'CODEFORCES');
  const lc = u.platforms.find((p) => p.platform === 'LEETCODE');

  const topicStatsRaw: Record<string, number> = {
    ...((cf?.codeforcesData?.tagStats as Record<string, number>) ?? {}),
    ...((lc?.leetcodeData?.tagStats as Record<string, number>) ?? {}),
  };

  const maxCount = Math.max(...Object.values(topicStatsRaw), 1);
  const topicStats = Object.entries(topicStatsRaw)
    .map(([topic, rawCount]) => ({
      topic,
      rawCount,
      value: Math.round((rawCount / maxCount) * 100),
    }))
    .sort((a, b) => b.rawCount - a.rawCount)
    .slice(0, 15);

  const ratingHistory = (cf?.codeforcesData?.ratingHistory as Array<{ date: string; rating: number; contestId: number }>) ?? [];
  const cfSolvedCount = cf ? await db.submission.count({ where: { connectionId: cf.id, verdict: { in: ['OK', 'AC', 'Accepted'] } } }) : 0;
  const lcSolvedCount = lc?.leetcodeData?.totalSolved ?? 0;
  const cfContestCount = ratingHistory.length;
  const lcContestCount = lc?.leetcodeData?.contestsAttended ?? 0;

  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    cfRating: cf?.codeforcesData?.currentRating ?? null,
    cfRank: cf?.codeforcesData?.rank ?? null,
    lcRating: lc?.leetcodeData?.contestRating ?? null,
    totalSolved: lc?.leetcodeData?.totalSolved ?? 0,
    cfSolvedCount,
    lcSolvedCount,
    cfContestCount,
    lcContestCount,
    streak: u.streaks?.currentStreak ?? 0,
    totalActiveDays: heatmapData.filter((d) => d.count > 0).length,
    ratingHistory,
    topicStats,
    heatmapData,
    lastSyncedAt: cf?.lastSyncedAt?.toISOString() ?? lc?.lastSyncedAt?.toISOString() ?? null,
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
      const data = getMockCompare(params.friendId);
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

    const friendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userAId: session.id, userBId: friendId },
          { userAId: friendId, userBId: session.id },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: { code: 'NOT_FRIENDS', message: 'Not friends' } }, { status: 403 });
    }

    const [user, friend] = await Promise.all([
      db.user.findUnique({
        where: { id: session.id },
        include: { platforms: { include: { codeforcesData: true, leetcodeData: true } }, streaks: true },
      }),
      db.user.findUnique({
        where: { id: friendId },
        include: { platforms: { include: { codeforcesData: true, leetcodeData: true } }, streaks: true },
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
        select: { id: true },
      });
      const subs = await db.submission.findMany({
        where: {
          connectionId: { in: connections.map((c) => c.id) },
          verdict: { in: ['OK', 'Accepted', 'AC'] },
          timestamp: { gte: oneYearAgo },
        },
        select: { timestamp: true },
      });
      const map: Record<string, number> = {};
      for (const s of subs) {
        const day = s.timestamp.toISOString().slice(0, 10);
        map[day] = (map[day] ?? 0) + 1;
      }
      return Object.entries(map).map(([date, count]) => ({ date, count }));
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
