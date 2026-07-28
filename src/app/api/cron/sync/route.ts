import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncPlatform } from '@/workers/syncWorker';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH_SIZE = 5;
const STALE_AFTER_MS = 1000 * 60 * 60 * 6;

// Vercel invokes this route on a schedule and supplies CRON_SECRET as a Bearer token.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
  const connections = await db.platformConnection.findMany({
    where: {
      OR: [
        { lastSyncedAt: null },
        { lastSyncedAt: { lt: staleBefore } },
        { syncStatus: 'ERROR' },
      ],
    },
    orderBy: { lastSyncedAt: 'asc' },
    take: BATCH_SIZE,
    select: { id: true },
  });

  const results = await Promise.allSettled(connections.map((connection) => syncPlatform(connection.id)));
  const failed = results.filter((result) => result.status === 'rejected').length;

  return NextResponse.json({ ok: failed === 0, processed: connections.length, failed });
}
