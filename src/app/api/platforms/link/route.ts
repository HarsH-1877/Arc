import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncPlatform } from '@/workers/syncWorker';
import type { Platform } from '@prisma/client';
import { getSession } from '@/lib/session';

// POST /api/platforms/link
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { platform, handle } = await request.json() as { platform: Platform; handle: string };
    if (!platform || !handle) {
      return NextResponse.json({ error: 'platform and handle are required' }, { status: 400 });
    }

    // Validate handle exists on the platform
    if (platform === 'CODEFORCES') {
      const res = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
      const data = await res.json();
      if (data.status !== 'OK') {
        return NextResponse.json({ error: 'Codeforces handle not found' }, { status: 422 });
      }
    } else if (platform === 'LEETCODE') {
      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `query { matchedUser(username: "${handle}") { username } }` }),
      });
      const data = await res.json();
      if (!data?.data?.matchedUser) {
        return NextResponse.json({ error: 'LeetCode username not found' }, { status: 422 });
      }
    }

    const connection = await db.platformConnection.upsert({
      where: { userId_platform: { userId: session.id, platform } },
      create: { userId: session.id, platform, handle, syncStatus: 'PENDING' },
      update: { handle, syncStatus: 'PENDING', syncError: null },
    });

    await syncPlatform(connection.id);

    return NextResponse.json({ ok: true, connectionId: connection.id, status: 'SYNCED' });
  } catch (err) {
    console.error('[platforms/link]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
