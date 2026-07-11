import { db } from '@/lib/db';
import { getCFUser, getCFRatingHistory, getCFSubmissions } from '@/lib/fetchers/codeforces';
import { getLCSolvedStats, getLCContestInfo, getLCRecentSubmissions, getLCTagStats } from '@/lib/fetchers/leetcode';
import type { Platform } from '@prisma/client';

// ─── Streak calculation ──────────────────────────────────────────────────────

export async function recalculateStreak(userId: string): Promise<void> {
  // Get all platform connections for this user
  const connections = await db.platformConnection.findMany({
    where: { userId },
    select: { id: true },
  });
  const connectionIds = connections.map((c) => c.id);

  // Get all AC submission dates across all platforms
  const submissions = await db.submission.findMany({
    where: {
      connectionId: { in: connectionIds },
      verdict: { in: ['OK', 'Accepted', 'AC'] },
    },
    select: { timestamp: true },
    orderBy: { timestamp: 'desc' },
  });

  if (!submissions.length) {
    await db.streak.upsert({
      where: { userId },
      create: { userId, currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
      update: { currentStreak: 0, totalActiveDays: 0 },
    });
    return;
  }

  // Get unique active dates (YYYY-MM-DD)
  const activeDates = Array.from(
    new Set(submissions.map((s) => s.timestamp.toISOString().slice(0, 10)))
  ).sort().reverse(); // most recent first

  const totalActiveDays = activeDates.length;

  // Calculate current streak from today backwards
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let currentStreak = 0;
  const startDay = activeDates[0] === today || activeDates[0] === yesterday ? activeDates[0] : null;

  if (startDay) {
    const sortedAsc = [...activeDates].sort();
    // Walk back from the most recent active day
    let cursor = new Date(startDay);
    for (let i = activeDates.length - 1; i >= 0; i--) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (activeDates.includes(dateStr)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  const sortedAsc = [...activeDates].sort();

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1]);
    const curr = new Date(sortedAsc[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  const lastActiveDate = activeDates[0] ? new Date(activeDates[0]) : null;

  await db.streak.upsert({
    where: { userId },
    create: { userId, currentStreak, longestStreak, lastActiveDate, totalActiveDays },
    update: { currentStreak, longestStreak, lastActiveDate, totalActiveDays },
  });
}

// ─── Platform sync ───────────────────────────────────────────────────────────

export async function syncPlatform(connectionId: string): Promise<void> {
  const connection = await db.platformConnection.findUnique({
    where: { id: connectionId },
    include: { user: { select: { id: true } } },
  });

  if (!connection) throw new Error(`Connection ${connectionId} not found`);

  // Mark as syncing
  await db.platformConnection.update({
    where: { id: connectionId },
    data: { syncStatus: 'SYNCING', syncError: null },
  });

  try {
    if (connection.platform === 'CODEFORCES') {
      await syncCodeforces(connectionId, connection.handle, connection.user.id);
    } else {
      await syncLeetCode(connectionId, connection.handle, connection.user.id);
    }

    await db.platformConnection.update({
      where: { id: connectionId },
      data: { syncStatus: 'SYNCED', lastSyncedAt: new Date() },
    });

    await recalculateStreak(connection.user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    await db.platformConnection.update({
      where: { id: connectionId },
      data: { syncStatus: 'ERROR', syncError: message },
    });
    throw err;
  }
}

async function syncCodeforces(connectionId: string, handle: string, userId: string) {
  const [cfUser, ratingHistory, submissions] = await Promise.all([
    getCFUser(handle),
    getCFRatingHistory(handle),
    getCFSubmissions(handle, 500),
  ]);

  // Build tag stats from AC submissions
  const tagStats: Record<string, number> = {};
  const difficultyStats: Record<string, number> = {};
  for (const sub of submissions) {
    if (sub.verdict !== 'OK') continue;
    for (const tag of sub.problem.tags) {
      tagStats[tag] = (tagStats[tag] ?? 0) + 1;
    }
    if (sub.problem.rating) {
      const bucket = String(Math.floor(sub.problem.rating / 100) * 100);
      difficultyStats[bucket] = (difficultyStats[bucket] ?? 0) + 1;
    }
  }

  // Upsert CF data
  await db.codeforcesData.upsert({
    where: { connectionId },
    create: {
      connectionId,
      currentRating: cfUser.rating ?? null,
      maxRating: cfUser.maxRating ?? null,
      rank: cfUser.rank ?? null,
      maxRank: cfUser.maxRank ?? null,
      contribution: cfUser.contribution ?? 0,
      friendOfCount: cfUser.friendOfCount ?? 0,
      titlePhoto: cfUser.titlePhoto ?? null,
      ratingHistory: ratingHistory.map((r) => ({
        contestId: r.contestId,
        contestName: r.contestName,
        rating: r.newRating,
        date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
      })),
      tagStats,
      difficultyStats,
    },
    update: {
      currentRating: cfUser.rating ?? null,
      maxRating: cfUser.maxRating ?? null,
      rank: cfUser.rank ?? null,
      maxRank: cfUser.maxRank ?? null,
      contribution: cfUser.contribution ?? 0,
      friendOfCount: cfUser.friendOfCount ?? 0,
      titlePhoto: cfUser.titlePhoto ?? null,
      ratingHistory: ratingHistory.map((r) => ({
        contestId: r.contestId,
        contestName: r.contestName,
        rating: r.newRating,
        date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
      })),
      tagStats,
      difficultyStats,
    },
  });

  // Upsert submissions (only AC)
  const acSubs = submissions.filter((s) => s.verdict === 'OK');
  for (const sub of acSubs) {
    await db.submission.upsert({
      where: { connectionId_externalId: { connectionId, externalId: String(sub.id) } },
      create: {
        connectionId,
        externalId: String(sub.id),
        problemName: sub.problem.name,
        platform: 'CODEFORCES',
        verdict: 'AC',
        language: sub.programmingLanguage,
        timestamp: new Date(sub.creationTimeSeconds * 1000),
        contestId: sub.contestId ? String(sub.contestId) : null,
        difficulty: sub.problem.rating ? String(sub.problem.rating) : null,
        tags: sub.problem.tags,
      },
      update: {},
    });
  }

  // Upsert contest results
  for (const r of ratingHistory) {
    await db.contestResult.upsert({
      where: { connectionId_contestId_platform: { connectionId, contestId: String(r.contestId), platform: 'CODEFORCES' } },
      create: {
        connectionId,
        platform: 'CODEFORCES',
        contestId: String(r.contestId),
        contestName: r.contestName,
        rank: r.rank,
        ratingChange: r.newRating - r.oldRating,
        newRating: r.newRating,
        timestamp: new Date(r.ratingUpdateTimeSeconds * 1000),
      },
      update: { rank: r.rank, ratingChange: r.newRating - r.oldRating, newRating: r.newRating },
    });
  }
}

async function syncLeetCode(connectionId: string, username: string, userId: string) {
  const [solvedStats, contestInfo, recentSubs, tagStats] = await Promise.all([
    getLCSolvedStats(username),
    getLCContestInfo(username),
    getLCRecentSubmissions(username, 50),
    getLCTagStats(username),
  ]);

  const tagStatsMap: Record<string, number> = {};
  for (const t of tagStats) {
    tagStatsMap[t.tagName] = t.problemsSolved;
  }

  await db.leetcodeData.upsert({
    where: { connectionId },
    create: {
      connectionId,
      totalSolved: solvedStats.totalSolved,
      easySolved: solvedStats.easySolved,
      mediumSolved: solvedStats.mediumSolved,
      hardSolved: solvedStats.hardSolved,
      acceptanceRate: solvedStats.acceptanceRate,
      contestRating: contestInfo?.rating ?? null,
      contestsAttended: contestInfo?.attended ?? 0,
      topPercentage: contestInfo?.topPercentage ?? null,
      tagStats: tagStatsMap,
    },
    update: {
      totalSolved: solvedStats.totalSolved,
      easySolved: solvedStats.easySolved,
      mediumSolved: solvedStats.mediumSolved,
      hardSolved: solvedStats.hardSolved,
      acceptanceRate: solvedStats.acceptanceRate,
      contestRating: contestInfo?.rating ?? null,
      contestsAttended: contestInfo?.attended ?? 0,
      topPercentage: contestInfo?.topPercentage ?? null,
      tagStats: tagStatsMap,
    },
  });

  // Upsert recent AC submissions
  for (const sub of recentSubs) {
    if (sub.statusDisplay !== 'Accepted') continue;
    await db.submission.upsert({
      where: { connectionId_externalId: { connectionId, externalId: sub.id } },
      create: {
        connectionId,
        externalId: sub.id,
        problemName: sub.title,
        problemSlug: sub.titleSlug,
        platform: 'LEETCODE',
        verdict: 'AC',
        language: sub.lang,
        timestamp: new Date(Number(sub.timestamp) * 1000),
        tags: [],
      },
      update: {},
    });
  }
}
