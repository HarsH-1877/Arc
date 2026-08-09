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
    const verdict = searchParams.get('verdict');
    const difficulty = searchParams.get('difficulty');
    const tags = searchParams.getAll('tag');
    const language = searchParams.get('lang');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10));

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
    
    if (verdict && verdict !== 'All') {
      if (verdict === 'AC') {
        where.verdict = { in: ['OK', 'Accepted', 'AC'] };
      } else if (verdict === 'ATTEMPTED') {
        // Attempted = submitted but not accepted
        where.verdict = { notIn: ['OK', 'Accepted', 'AC'] };
        // Must have at least one WA/TLE/RE type verdict (not just skipped)
      } else if (verdict === 'WA') {
        where.verdict = { contains: 'Wrong Answer', mode: 'insensitive' };
      }
    }

    if (difficulty && difficulty !== 'All') {
      // Check if it's a CF rating range like "800-1600"
      const rangeMatch = difficulty.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        // CF numeric range filter — difficulty stored as string like "800", "1200"
        const minD = rangeMatch[1];
        const maxD = rangeMatch[2];
        // Use a raw filter on numeric comparison for the difficulty field
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          { difficulty: { gte: minD } },
          { difficulty: { lte: maxD } },
        ];
      } else {
        where.difficulty = { equals: difficulty, mode: 'insensitive' };
      }
    }

    if (tags.length > 0 && tags[0] !== '') {
      where.tags = { hasSome: tags };
    }

    if (language && language !== 'All') {
      where.language = { contains: language, mode: 'insensitive' };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { problemName: { contains: q, mode: 'insensitive' } },
        { externalId: { contains: q, mode: 'insensitive' } },
        { contestId: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.SubmissionOrderByWithRelationInput = { timestamp: 'desc' };
    if (sort === 'oldest') {
      orderBy = { timestamp: 'asc' };
    } else if (sort === 'difficulty_asc') {
      orderBy = { difficulty: 'asc' };
    } else if (sort === 'difficulty_desc') {
      orderBy = { difficulty: 'desc' };
    }

    const [rawItems, total] = await Promise.all([
      db.submission.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.submission.count({ where }),
    ]);

    // No mock fallback — return real DB data only
    const items = rawItems.map((p) => {
      let contestName: string | null = null;
      if (p.contestId) {
        if (p.platform === 'CODEFORCES') {
          contestName = `Codeforces Round ${p.contestId}`;
        } else if (p.platform === 'LEETCODE') {
          contestName = `Weekly Contest ${p.contestId}`;
        } else {
          contestName = `Contest ${p.contestId}`;
        }
      }
      return { ...p, contestName };
    });

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
