import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { USE_MOCK_DATA, MOCK_SEARCH_USERS, MOCK_FRIENDS } from '@/lib/mock';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().toLowerCase() ?? '';

  if (USE_MOCK_DATA) {
    if (!q || q.length < 2) return NextResponse.json([]);
    const pool = [...MOCK_SEARCH_USERS, ...MOCK_FRIENDS.map((f) => ({ ...f, relationship: 'FRIEND' as const }))];
    return NextResponse.json(
      pool.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.displayName?.toLowerCase().includes(q) ?? false),
      ),
    );
  }

  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    if (!q || q.length < 2) return NextResponse.json([]);

    const users = await db.user.findMany({
      where: {
        AND: [
          { id: { not: session.id } },
          {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: 10,
      include: {
        platforms: { include: { codeforcesData: true, leetcodeData: true } },
        friendsA: { where: { userBId: session.id } },
        friendsB: { where: { userAId: session.id } },
        sentRequests: { where: { receiverId: session.id } },
        receivedRequests: { where: { senderId: session.id } },
      },
    });

    const results = users.map((u) => {
      const cf = u.platforms.find((p) => p.platform === 'CODEFORCES');
      const lc = u.platforms.find((p) => p.platform === 'LEETCODE');

      const isFriend = u.friendsA.length > 0 || u.friendsB.length > 0;
      const sentReq = u.sentRequests.find(r => r.status === 'PENDING');
      const receivedReq = u.receivedRequests.find(r => r.status === 'PENDING');

      let relationship: 'NONE' | 'FRIEND' | 'PENDING_INCOMING' | 'PENDING_OUTGOING' = 'NONE';
      
      if (isFriend) {
        relationship = 'FRIEND';
      } else if (sentReq) {
        relationship = 'PENDING_INCOMING';
      } else if (receivedReq) {
        relationship = 'PENDING_OUTGOING';
      }

      return {
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        cfRating: cf?.codeforcesData?.currentRating ?? null,
        lcRating: lc?.leetcodeData?.contestRating ?? null,
        relationship,
      };
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error('[GET /api/friends/search]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
