import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { getStoredCodeforcesProblemKey } from '@/lib/codeforces/solved-problems';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: {
        platforms: {
          include: {
            codeforcesData: true,
            leetcodeData: true,
            codechefData: true,
          },
        },
      },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const connectionIds = user.platforms.map((p) => p.id);
    const where: Prisma.SubmissionWhereInput = {
      connectionId: { in: connectionIds },
    };

    if (platform && platform !== 'ALL') {
      where.platform = platform as any;
    }

    const [submissions, contestResults] = await Promise.all([
      db.submission.findMany({
        where,
        select: {
          verdict: true,
          tags: true,
          language: true,
          timestamp: true,
          problemName: true,
          platform: true,
          contestId: true,
          problemSlug: true,
        },
      }),
      db.contestResult.count({
        where: {
          connectionId: { in: connectionIds },
          ...(platform && platform !== 'ALL' ? { platform: platform as any } : {}),
        },
      }),
    ]);

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    let totalAttempts = 0;
    let totalAccepted = 0;
    let recentAttempts = 0;
    let recentAccepted = 0;

    // topicStats from CF submissions (which have real tags)
    const cfTopicStats: Record<string, { attempts: number; accepted: number }> = {};
    const languageStats: Record<string, number> = {};
    const solvedSet = new Set<string>();

    for (const sub of submissions) {
      totalAttempts++;
      const isAc = ['OK', 'Accepted', 'AC'].includes(sub.verdict);
      const isRecent = new Date(sub.timestamp) >= ninetyDaysAgo;

      if (isRecent) {
        recentAttempts++;
        if (isAc) recentAccepted++;
      }

      if (isAc) {
        totalAccepted++;
        solvedSet.add(sub.platform === 'CODEFORCES'
          ? getStoredCodeforcesProblemKey(sub)
          : sub.problemName);
      }

      if (sub.language) {
        languageStats[sub.language] = (languageStats[sub.language] || 0) + 1;
      }

      // Accumulate tag stats from CF & CC
      if (sub.platform === 'CODEFORCES' || sub.platform === 'CODECHEF') {
        for (const tag of sub.tags) {
          if (!cfTopicStats[tag]) cfTopicStats[tag] = { attempts: 0, accepted: 0 };
          cfTopicStats[tag].attempts++;
          if (isAc) cfTopicStats[tag].accepted++;
        }
      }
    }

    // ─── Compute accurate totals using platform data ───────────────────────────

    const cfConn = user.platforms.find((p) => p.platform === 'CODEFORCES');
    const lcConn = user.platforms.find((p) => p.platform === 'LEETCODE');
    const ccConn = user.platforms.find((p) => p.platform === 'CODECHEF');

    const shouldIncludeCF = !platform || platform === 'ALL' || platform === 'CODEFORCES';
    const shouldIncludeLC = !platform || platform === 'ALL' || platform === 'LEETCODE';
    const shouldIncludeCC = !platform || platform === 'ALL' || platform === 'CODECHEF';

    // For LC, use the totalSolved from LeetcodeData (authoritative, not just recent 2000)
    const lcSolved = shouldIncludeLC ? (lcConn?.leetcodeData?.totalSolved ?? 0) : 0;
    const lcAcceptanceRate = shouldIncludeLC ? (lcConn?.leetcodeData?.acceptanceRate ?? 0) : 0;
    const ccSolved = shouldIncludeCC ? (ccConn?.codechefData?.totalSolved ?? 0) : 0;

    const cfSolvedSet = new Set(
      submissions
        .filter((s) => s.platform === 'CODEFORCES' && ['OK', 'Accepted', 'AC'].includes(s.verdict))
        .map(getStoredCodeforcesProblemKey),
    );
    const cfSolvedCount = cfConn?.codeforcesData ? cfSolvedSet.size : 0;

    // Final totalSolved: for ALL use sum of distinct solved, for specific platform use authoritative data
    let finalTotalSolved: number;
    let finalAccuracy: number;

    if (platform === 'LEETCODE') {
      finalTotalSolved = lcSolved;
      finalAccuracy = Math.min(100, Math.round(lcAcceptanceRate * 10) / 10);
    } else if (platform === 'CODECHEF') {
      finalTotalSolved = ccSolved;
      finalAccuracy = totalAttempts > 0 ? Math.min(100, Math.round((totalAccepted / totalAttempts) * 1000) / 10) : 75;
    } else if (platform === 'CODEFORCES') {
      finalTotalSolved = cfSolvedCount;
      finalAccuracy = totalAttempts > 0 ? Math.min(100, Math.round((totalAccepted / totalAttempts) * 1000) / 10) : 0;
    } else {
      // ALL: combine
      finalTotalSolved = cfSolvedCount + lcSolved + ccSolved;
      const otherAttempts = totalAttempts;
      const otherAccuracy = otherAttempts > 0 ? Math.min(100, (totalAccepted / otherAttempts) * 100) : 0;
      if (lcSolved > 0 && lcAcceptanceRate > 0 && finalTotalSolved > 0) {
        const lcWeight = lcSolved / finalTotalSolved;
        const otherWeight = 1 - lcWeight;
        finalAccuracy = Math.min(100, Math.round((lcAcceptanceRate * lcWeight + otherAccuracy * otherWeight) * 10) / 10);
      } else {
        finalAccuracy = Math.min(100, Math.round(otherAccuracy * 10) / 10);
      }
    }

    const totalSolvedTrend = recentAccepted > 0 ? `+${recentAccepted} vs last 90 days` : 'All time';
    const recentAccuracy = recentAttempts > 0 ? (recentAccepted / recentAttempts) * 100 : finalAccuracy;
    const accuracyDiff = recentAccuracy - finalAccuracy;
    const accuracyTrend = totalAttempts > 0
      ? `${accuracyDiff >= 0 ? '+' : ''}${Math.abs(accuracyDiff) < 0.1 ? '0.0' : accuracyDiff.toFixed(1)}% vs 90d`
      : 'Submission rate';

    // ─── Topic Weakness ────────────────────────────────────────────────────────

    // Merge CF submission-based topic stats with LC tagStats from LeetcodeData
    const mergedTopicStats: Record<string, { attempts: number; accepted: number }> = { ...cfTopicStats };

    if (shouldIncludeLC && lcConn?.leetcodeData?.tagStats) {
      const lcTagStats = lcConn.leetcodeData.tagStats as Record<string, number>;
      for (const [tag, solved] of Object.entries(lcTagStats)) {
        if (!mergedTopicStats[tag]) mergedTopicStats[tag] = { attempts: 0, accepted: 0 };
        // LC tagStats only gives solved count, not attempts — assume 70% acceptance baseline
        mergedTopicStats[tag].accepted += solved;
        mergedTopicStats[tag].attempts += Math.ceil(solved / 0.7);
      }
    }

    let maxSolved = 1;
    for (const tag in mergedTopicStats) {
      if (mergedTopicStats[tag].accepted > maxSolved) maxSolved = mergedTopicStats[tag].accepted;
    }

    // Filter out very niche tags (< 3 accepted) and compute weakness scores
    const weaknessList = Object.entries(mergedTopicStats)
      .filter(([, s]) => s.accepted >= 1 && s.attempts >= 2)
      .map(([topic, s]) => {
        const accuracy = s.attempts > 0 ? s.accepted / s.attempts : 0;
        const normalizedSolved = Math.min(s.accepted / maxSolved, 1);
        const confidence = Math.min(s.attempts / 5, 1);
        // Low accuracy = weak. Low volume relative to your best topic = secondary signal.
        const score = ((1 - accuracy) * 60 + (1 - normalizedSolved) * 40) * (0.4 + 0.6 * confidence);

        let recommendation: string;
        if (accuracy < 0.4) recommendation = 'Low accuracy — review core concepts';
        else if (accuracy < 0.65) recommendation = 'Practice more medium problems';
        else if (s.accepted < 10) recommendation = 'Under-explored — attempt more';
        else recommendation = 'Revise and strengthen basics';

        return {
          topic,
          accuracy: Math.round(accuracy * 100),
          score: Math.round(score),
          solved: s.accepted,
          attempts: s.attempts,
          recommendation,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // ─── Language Breakdown ────────────────────────────────────────────────────

    const languageBreakdown = Object.entries(languageStats)
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalAttempts,
      totalAccepted: finalTotalSolved,
      acceptanceRate: finalAccuracy,
      totalSolved: finalTotalSolved,
      totalSolvedTrend,
      accuracy: finalAccuracy,
      accuracyTrend,
      totalSubmissions: totalAttempts,
      totalSubmissionsTrend: recentAttempts > 0 ? `+${recentAttempts} vs last 90 days` : 'All time',
      avgTime: '—',
      avgTimeTrend: '—',
      contestsSolved: contestResults,
      contestsTrend: '+0 vs last 90 days',
      topicWeakness: weaknessList,
      languageBreakdown: languageBreakdown.length > 0 ? languageBreakdown : [],
    });
  } catch (error) {
    console.error('[problems/stats] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
