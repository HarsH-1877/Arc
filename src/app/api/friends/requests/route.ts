import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { USE_MOCK_DATA, MOCK_FRIEND_REQUESTS } from '@/lib/mock';

export async function GET() {
  if (USE_MOCK_DATA) return NextResponse.json(MOCK_FRIEND_REQUESTS);

  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const requests = await db.friendRequest.findMany({
      where: {
        OR: [{ senderId: session.id }, { receiverId: session.id }],
        status: 'PENDING',
      },
      include: {
        sender: { include: { platforms: { include: { codeforcesData: true, leetcodeData: true } } } },
        receiver: { include: { platforms: { include: { codeforcesData: true, leetcodeData: true } } } },
      },
    });

    const formattedRequests = requests.map((req) => {
      const isIncoming = req.receiverId === session.id;
      const otherUser = req.senderId === session.id ? req.receiver : req.sender;
      const cf = otherUser.platforms.find((p) => p.platform === 'CODEFORCES');
      const lc = otherUser.platforms.find((p) => p.platform === 'LEETCODE');
      return {
        id: req.id,
        user: {
          id: otherUser.id,
          username: otherUser.username,
          displayName: otherUser.displayName,
          avatarUrl: otherUser.avatarUrl,
          cfRating: cf?.codeforcesData?.currentRating ?? null,
          lcRating: lc?.leetcodeData?.contestRating ?? null,
        },
        type: isIncoming ? 'INCOMING' : 'OUTGOING',
        createdAt: req.createdAt.toISOString(),
      };
    });

    return NextResponse.json(formattedRequests);
  } catch (err) {
    console.error('[GET /api/friends/requests]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { requestId, action } = await req.json();
    if (!requestId || !action) return NextResponse.json({ error: 'requestId and action required' }, { status: 400 });

    const request = await db.friendRequest.findUnique({ where: { id: requestId } });
    if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (request.senderId === session.id && action === 'REJECT') {
        // Cancel outgoing request
        await db.friendRequest.delete({ where: { id: requestId } });
        return NextResponse.json({ ok: true, status: 'CANCELLED' });
    }

    if (request.receiverId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'ACCEPT') {
      await db.$transaction([
        db.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
        }),
        db.friendship.create({
          data: {
            userAId: request.senderId,
            userBId: request.receiverId,
          },
        }),
      ]);
      return NextResponse.json({ ok: true, status: 'ACCEPTED' });
    } else if (action === 'REJECT') {
      await db.friendRequest.delete({ where: { id: requestId } });
      return NextResponse.json({ ok: true, status: 'REJECTED' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[PATCH /api/friends/requests]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
