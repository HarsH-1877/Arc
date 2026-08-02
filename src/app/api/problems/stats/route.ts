import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { platforms: true },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const connectionIds = user.platforms.map((p) => p.id);
    const where: Prisma.SubmissionWhereInput = {
      connectionId: { in: connectionIds },
    };

    if (platform && platform !== 'ALL') {
      where.platform = platform as any;
    }

    const submissions = await db.submission.findMany({
      where,
      select: {
        verdict: true,
        tags: true,
        language: true,
      }
    });

    let totalAttempts = 0;
    let totalAccepted = 0;
    const topicStats: Record<string, { attempts: number; accepted: number }> = {};
    const languageStats: Record<string, number> = {};

    for (const sub of submissions) {
      totalAttempts++;
      const isAc = ['OK', 'Accepted', 'AC'].includes(sub.verdict);
      if (isAc) totalAccepted++;

      if (sub.language) {
        languageStats[sub.language] = (languageStats[sub.language] || 0) + 1;
      }

      for (const tag of sub.tags) {
        if (!topicStats[tag]) topicStats[tag] = { attempts: 0, accepted: 0 };
        topicStats[tag].attempts++;
        if (isAc) topicStats[tag].accepted++;
      }
    }

    const acceptanceRate = totalAttempts > 0 ? (totalAccepted / totalAttempts) * 100 : 0;

    let maxSolved = 1;
    for (const tag in topicStats) {
      if (topicStats[tag].accepted > maxSolved) maxSolved = topicStats[tag].accepted;
    }

    const weaknessList = Object.entries(topicStats).map(([topic, stats]) => {
      const accuracy = stats.attempts > 0 ? stats.accepted / stats.attempts : 0;
      const normalizedSolved = Math.min(stats.accepted / maxSolved, 1);
      
      const weaknessScore = ((1 - accuracy) * 50) + ((1 - normalizedSolved) * 50);
      return {
        topic,
        accuracy: Math.round(accuracy * 100),
        score: Math.round(weaknessScore),
        solved: stats.accepted,
      };
    }).sort((a, b) => b.score - a.score).slice(0, 3);

    const languageBreakdown = Object.entries(languageStats)
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return NextResponse.json({
      totalAttempts,
      totalAccepted,
      acceptanceRate,
      topicWeakness: weaknessList,
      languageBreakdown,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
