import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

const TAG_ALIASES: Record<string, string[]> = {
  'Graph Theory': ['Graph Theory', 'graphs', 'graph', 'trees', 'shortest paths'],
  'Dynamic Programming': ['Dynamic Programming', 'dp', 'dynamic programming'],
  'Data Structures': ['Data Structures', 'data structures', 'dsu', 'trees'],
  'Trees': ['Trees', 'trees', 'tree'],
  'Math': ['Math', 'math', 'number theory', 'matrices'],
  'Greedy': ['Greedy', 'greedy'],
  'Strings': ['Strings', 'strings', 'string'],
  'Two Pointers': ['Two Pointers', 'two pointers'],
  'Binary Search': ['Binary Search', 'binary search'],
  'Sorting': ['Sorting', 'sortings', 'sorting'],
  'DFS/BFS': ['DFS/BFS', 'dfs and similar', 'dfs', 'bfs'],
  'Arrays': ['Arrays', 'arrays', 'array'],
  'Recursion': ['Recursion', 'recursion'],
  'Bit Manipulation': ['Bit Manipulation', 'bitmasks', 'bit manipulation'],
};

function getDifficultyValue(d: string | null): number {
  if (!d) return 1400;
  const num = parseInt(d, 10);
  if (!isNaN(num)) return num;
  const lower = d.toLowerCase();
  if (lower === 'easy') return 800;
  if (lower === 'medium') return 1400;
  if (lower === 'hard') return 2000;
  return 1400;
}

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
        where.verdict = { notIn: ['OK', 'Accepted', 'AC'] };
      } else if (verdict === 'WA') {
        where.verdict = { in: ['WA', 'Wrong Answer', 'WRONG_ANSWER'] };
      }
    }

    if (difficulty && difficulty !== 'All') {
      const rangeMatch = difficulty.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const minD = rangeMatch[1];
        const maxD = rangeMatch[2];
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          { difficulty: { gte: minD } },
          { difficulty: { lte: maxD } },
        ];
      } else {
        where.difficulty = { equals: difficulty, mode: 'insensitive' };
      }
    }

    if (tags.length > 0 && tags[0] !== '' && tags[0] !== 'All Tags') {
      const expandedTags = tags.flatMap((t) => TAG_ALIASES[t] ?? [t, t.toLowerCase()]);
      where.tags = { hasSome: expandedTags };
    }

    if (language && language !== 'All' && !language.startsWith('All')) {
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

    let rawItems: any[] = [];
    let total = 0;

    if (sort === 'difficulty_asc' || sort === 'difficulty_desc') {
      const allSubmissions = await db.submission.findMany({ where });
      allSubmissions.sort((a, b) => {
        const diffA = getDifficultyValue(a.difficulty);
        const diffB = getDifficultyValue(b.difficulty);
        return sort === 'difficulty_asc' ? diffA - diffB : diffB - diffA;
      });
      total = allSubmissions.length;
      rawItems = allSubmissions.slice((page - 1) * pageSize, page * pageSize);
    } else {
      let orderBy: Prisma.SubmissionOrderByWithRelationInput = { timestamp: 'desc' };
      if (sort === 'oldest') {
        orderBy = { timestamp: 'asc' };
      }
      [rawItems, total] = await Promise.all([
        db.submission.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.submission.count({ where }),
      ]);
    }

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
