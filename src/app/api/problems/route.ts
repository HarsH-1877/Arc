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
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

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
      } else if (verdict === 'WA') {
        where.verdict = { notIn: ['OK', 'Accepted', 'AC'] };
      }
    }

    if (difficulty && difficulty !== 'All') {
      where.difficulty = difficulty;
    }

    if (tags.length > 0 && tags[0] !== '') {
      where.tags = { hasSome: tags };
    }

    if (language && language !== 'All') {
      where.language = language;
    }

    const [items, total] = await Promise.all([
      db.submission.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.submission.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
