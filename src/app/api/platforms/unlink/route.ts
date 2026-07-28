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

    await db.platformConnection.deleteMany({
      where: { userId: session.id, platform },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[platforms/unlink]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
