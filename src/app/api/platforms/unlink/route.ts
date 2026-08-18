import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Platform } from '@prisma/client';
import { getSession } from '@/lib/session';

// DELETE /api/platforms/unlink
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { platform } = await request.json() as { platform: Platform };
    if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

    const connections = await db.platformConnection.findMany({
      where: { userId: session.id, platform },
      select: { id: true },
    });

    for (const c of connections) {
      await db.submission.deleteMany({ where: { connectionId: c.id } });
      await db.contestResult.deleteMany({ where: { connectionId: c.id } });
      await db.codeforcesData.deleteMany({ where: { connectionId: c.id } });
      await db.leetcodeData.deleteMany({ where: { connectionId: c.id } });
    }

    await db.platformConnection.deleteMany({
      where: { userId: session.id, platform },
    });

    const { recalculateStreak } = await import('@/workers/syncWorker');
    await recalculateStreak(session.id).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[platforms/unlink]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
