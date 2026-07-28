import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncPlatform } from '@/workers/syncWorker';
import type { Platform } from '@prisma/client';
import { getSession } from '@/lib/session';

// POST /api/platforms/sync
// Body: { platform?: 'CODEFORCES' | 'LEETCODE' } — optional, syncs all if omitted
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const body = await request.json().catch(() => ({})) as { platform?: Platform };

    const connections = await db.platformConnection.findMany({
      where: {
        userId: session.id,
        ...(body.platform ? { platform: body.platform } : {}),
      },
    });

    if (!connections.length) {
      return NextResponse.json({ error: 'No platform connections found' }, { status: 404 });
    }

    const results = await Promise.allSettled(connections.map((conn) => syncPlatform(conn.id)));
    const failed = results.filter((result) => result.status === 'rejected').length;

    return NextResponse.json({ ok: failed === 0, status: failed === 0 ? 'SYNCED' : 'PARTIAL_FAILURE', count: connections.length, failed }, { status: failed === 0 ? 200 : 207 });
  } catch (err) {
    console.error('[platforms/sync]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
