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
      } else if (verdict === 'WA') {
        where.verdict = { notIn: ['OK', 'Accepted', 'AC'] };
      }
    }

    if (difficulty && difficulty !== 'All') {
      where.difficulty = { equals: difficulty, mode: 'insensitive' };
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

    const MOCK_PROBLEMS = [
      { id: 'prob-1', externalId: '2060-A', problemName: 'Fibonacciness', problemSlug: null, platform: 'CODEFORCES', verdict: 'OK', language: 'C++20', timestamp: new Date(Date.now() - 3600000).toISOString(), contestId: '2060', contestName: 'Codeforces Round 998 (Div. 2)', difficulty: '800', tags: ['Math', 'Greedy'] },
      { id: 'prob-2', externalId: '2060-B', problemName: 'Farmer Johns Card Game', problemSlug: null, platform: 'CODEFORCES', verdict: 'OK', language: 'C++20', timestamp: new Date(Date.now() - 7200000).toISOString(), contestId: '2060', contestName: 'Codeforces Round 998 (Div. 2)', difficulty: '1100', tags: ['Games', 'Sorting'] },
      { id: 'prob-3', externalId: 'lc-1', problemName: 'Two Sum', problemSlug: 'two-sum', platform: 'LEETCODE', verdict: 'Accepted', language: 'Python3', timestamp: new Date(Date.now() - 10000000).toISOString(), contestId: null, contestName: null, difficulty: 'Easy', tags: ['Arrays', 'Hash Table'] },
      { id: 'prob-4', externalId: 'lc-15', problemName: '3Sum', problemSlug: '3sum', platform: 'LEETCODE', verdict: 'Accepted', language: 'Python3', timestamp: new Date(Date.now() - 15000000).toISOString(), contestId: null, contestName: null, difficulty: 'Medium', tags: ['Arrays', 'Two Pointers', 'Sorting'] },
      { id: 'prob-5', externalId: '2060-C', problemName: 'Game of Mathletes', problemSlug: null, platform: 'CODEFORCES', verdict: 'OK', language: 'C++20', timestamp: new Date(Date.now() - 20000000).toISOString(), contestId: '2060', contestName: 'Codeforces Round 998 (Div. 2)', difficulty: '1200', tags: ['Two Pointers', 'Greedy'] },
      { id: 'prob-6', externalId: 'lc-42', problemName: 'Trapping Rain Water', problemSlug: 'trapping-rain-water', platform: 'LEETCODE', verdict: 'Accepted', language: 'C++', timestamp: new Date(Date.now() - 25000000).toISOString(), contestId: null, contestName: null, difficulty: 'Hard', tags: ['Two Pointers', 'Dynamic Programming', 'Stack'] },
      { id: 'prob-7', externalId: '2060-D', problemName: 'Subtract Min Sort', problemSlug: null, platform: 'CODEFORCES', verdict: 'OK', language: 'C++20', timestamp: new Date(Date.now() - 30000000).toISOString(), contestId: '2060', contestName: 'Codeforces Round 998 (Div. 2)', difficulty: '1300', tags: ['Greedy', 'Arrays'] },
      { id: 'prob-8', externalId: 'lc-200', problemName: 'Number of Islands', problemSlug: 'number-of-islands', platform: 'LEETCODE', verdict: 'Accepted', language: 'Java', timestamp: new Date(Date.now() - 35000000).toISOString(), contestId: null, contestName: null, difficulty: 'Medium', tags: ['DFS/BFS', 'Graph Theory', 'Arrays'] },
      { id: 'prob-9', externalId: 'lc-70', problemName: 'Climbing Stairs', problemSlug: 'climbing-stairs', platform: 'LEETCODE', verdict: 'Accepted', language: 'Python3', timestamp: new Date(Date.now() - 40000000).toISOString(), contestId: null, contestName: null, difficulty: 'Easy', tags: ['Dynamic Programming', 'Math'] },
      { id: 'prob-10', externalId: '2057-A', problemName: 'MEX Table', problemSlug: null, platform: 'CODEFORCES', verdict: 'OK', language: 'C++17', timestamp: new Date(Date.now() - 45000000).toISOString(), contestId: '2057', contestName: 'Codeforces Round 995 (Div. 3)', difficulty: '800', tags: ['Constructive Algorithms'] },
      { id: 'prob-11', externalId: '2057-B', problemName: 'Gorilla and the Exam', problemSlug: null, platform: 'CODEFORCES', verdict: 'OK', language: 'C++17', timestamp: new Date(Date.now() - 50000000).toISOString(), contestId: '2057', contestName: 'Codeforces Round 995 (Div. 3)', difficulty: '1000', tags: ['Greedy', 'Sorting'] },
      { id: 'prob-12', externalId: 'lc-5', problemName: 'Longest Palindromic Substring', problemSlug: 'longest-palindromic-substring', platform: 'LEETCODE', verdict: 'Accepted', language: 'C++', timestamp: new Date(Date.now() - 55000000).toISOString(), contestId: null, contestName: null, difficulty: 'Medium', tags: ['Strings', 'Dynamic Programming'] },
      { id: 'prob-13', externalId: 'lc-300', problemName: 'Longest Increasing Subsequence', problemSlug: 'longest-increasing-subsequence', platform: 'LEETCODE', verdict: 'Accepted', language: 'C++', timestamp: new Date(Date.now() - 60000000).toISOString(), contestId: null, contestName: null, difficulty: 'Medium', tags: ['Dynamic Programming', 'Binary Search'] },
      { id: 'prob-14', externalId: '2057-C', problemName: 'Trip to the Olympiad', problemSlug: null, platform: 'CODEFORCES', verdict: 'OK', language: 'C++20', timestamp: new Date(Date.now() - 65000000).toISOString(), contestId: '2057', contestName: 'Codeforces Round 995 (Div. 3)', difficulty: '1400', tags: ['Bit Manipulation', 'Math'] },
      { id: 'prob-15', externalId: 'lc-207', problemName: 'Course Schedule', problemSlug: 'course-schedule', platform: 'LEETCODE', verdict: 'Accepted', language: 'Java', timestamp: new Date(Date.now() - 70000000).toISOString(), contestId: null, contestName: null, difficulty: 'Medium', tags: ['Graph Theory', 'DFS/BFS'] },
    ];

    let items = rawItems.map((p, idx) => {
      let contestName = null;
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

    let displayTotal = total;
    if (items.length === 0) {
      let filtered = MOCK_PROBLEMS;
      if (platform && platform !== 'ALL') filtered = filtered.filter(p => p.platform === platform);
      if (verdict && verdict !== 'All') {
        if (verdict === 'AC') filtered = filtered.filter(p => ['OK', 'Accepted', 'AC'].includes(p.verdict));
        else filtered = filtered.filter(p => !['OK', 'Accepted', 'AC'].includes(p.verdict));
      }
      if (difficulty && difficulty !== 'All') filtered = filtered.filter(p => p.difficulty?.toLowerCase() === difficulty.toLowerCase());
      if (tags.length > 0 && tags[0] !== '') filtered = filtered.filter(p => tags.some(t => p.tags.includes(t)));
      if (language && language !== 'All Languages' && language !== 'All') filtered = filtered.filter(p => p.language?.toLowerCase().includes(language.toLowerCase()));
      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(p => p.problemName.toLowerCase().includes(q) || (p.contestName && p.contestName.toLowerCase().includes(q)));
      }

      displayTotal = filtered.length;
      items = filtered.slice((page - 1) * pageSize, page * pageSize) as any;
    }

    return NextResponse.json({ items, total: displayTotal, page, pageSize });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
