import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { USE_MOCK_DATA, MOCK_FRIENDS } from '@/lib/mock';

export async function GET() {
  if (USE_MOCK_DATA) return NextResponse.json(MOCK_FRIENDS);

  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ userAId: session.id }, { userBId: session.id }],
      },
      include: {
        userA: { include: { platforms: { include: { codeforcesData: true, leetcodeData: true } } } },
        userB: { include: { platforms: { include: { codeforcesData: true, leetcodeData: true } } } },
      },
    });

    const friends = friendships.map((f) => {
      const friend = f.userAId === session.id ? f.userB : f.userA;
      const cf = friend.platforms.find((p) => p.platform === 'CODEFORCES');
      const lc = friend.platforms.find((p) => p.platform === 'LEETCODE');
      return {
        id: friend.id,
        username: friend.username,
        displayName: friend.displayName,
        avatarUrl: friend.avatarUrl,
        cfRating: cf?.codeforcesData?.currentRating ?? null,
        lcRating: lc?.leetcodeData?.contestRating ?? null,
        friendshipId: f.id,
      };
    });

    return NextResponse.json(friends);
  } catch (err) {
    console.error('[GET /api/friends]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { friendId } = await req.json();
    if (!friendId) return NextResponse.json({ error: 'friendId required' }, { status: 400 });
    if (friendId === session.id) return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 });

    const targetUser = await db.user.findUnique({ where: { id: friendId } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Check if friendship already exists
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userAId: session.id, userBId: friendId },
          { userAId: friendId, userBId: session.id },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 });
    }

    // Check if request already exists
    const existingRequest = await db.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.id, receiverId: friendId },
          { senderId: friendId, receiverId: session.id },
        ],
        status: 'PENDING'
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'Request already exists' }, { status: 400 });
    }

    const request = await db.friendRequest.create({
      data: {
        senderId: session.id,
        receiverId: friendId,
        status: 'PENDING',
      },
    });

    return NextResponse.json(request);
  } catch (err) {
    console.error('[POST /api/friends]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
