import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Platform } from '@prisma/client';
import { getSession } from '@/lib/session';
import { getCFUser } from '@/lib/fetchers/codeforces';
import { getLCSolvedStats } from '@/lib/fetchers/leetcode';
import { queueBackgroundSync } from '@/lib/sync/background';

const HANDLE_RE = /^[a-zA-Z0-9_-]{1,24}$/;

// POST /api/platforms/link
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { platform, handle } = await request.json() as { platform: Platform; handle: string };
    if (!platform || !handle) {
      return NextResponse.json({ error: 'platform and handle are required' }, { status: 400 });
    }

    if (!HANDLE_RE.test(handle)) {
      return NextResponse.json({ error: 'Invalid handle format' }, { status: 400 });
    }

    if (platform === 'CODEFORCES') {
      try {
        await getCFUser(handle);
      } catch {
        return NextResponse.json({ error: 'Codeforces handle not found' }, { status: 422 });
      }
    } else if (platform === 'LEETCODE') {
      try {
        await getLCSolvedStats(handle);
      } catch {
        return NextResponse.json({ error: 'LeetCode username not found' }, { status: 422 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    const taken = await db.platformConnection.findFirst({
      where: {
        platform,
        handle,
        userId: { not: session.id },
      },
    });
    if (taken) {
      return NextResponse.json({ error: 'This handle is already linked to another Arc account.' }, { status: 409 });
    }

    const connection = await db.platformConnection.upsert({
      where: { userId_platform: { userId: session.id, platform } },
      create: { userId: session.id, platform, handle, syncStatus: 'PENDING' },
      update: { handle, syncStatus: 'PENDING', syncError: null },
    });

    queueBackgroundSync(connection.id, true);

    return NextResponse.json({ ok: true, connectionId: connection.id, status: 'SYNCING' });
  } catch (err) {
    console.error('[platforms/link]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
