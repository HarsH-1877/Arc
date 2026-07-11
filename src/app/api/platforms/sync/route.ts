import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { syncPlatform } from '@/workers/syncWorker';
import type { Platform } from '@prisma/client';

// POST /api/platforms/sync
// Body: { platform?: 'CODEFORCES' | 'LEETCODE' } — optional, syncs all if omitted
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const uid = cookieStore.get('arc-session')?.value;
    if (!uid) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const firebaseUser = await adminAuth.getUser(uid);
    if (!firebaseUser.email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    const user = await db.user.findUnique({ where: { email: firebaseUser.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json().catch(() => ({})) as { platform?: Platform };

    const connections = await db.platformConnection.findMany({
      where: {
        userId: user.id,
        ...(body.platform ? { platform: body.platform } : {}),
      },
    });

    if (!connections.length) {
      return NextResponse.json({ error: 'No platform connections found' }, { status: 404 });
    }

    // Fire-and-forget all sync jobs
    for (const conn of connections) {
      syncPlatform(conn.id).catch(console.error);
    }

    return NextResponse.json({ ok: true, status: 'syncing', count: connections.length });
  } catch (err) {
    console.error('[platforms/sync]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
