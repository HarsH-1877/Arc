import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const friendshipId = params.id;

    const friendship = await db.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (friendship.userAId !== session.id && friendship.userBId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.friendship.delete({ where: { id: friendshipId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/friends/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
