import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { syncPlatform } from '@/workers/syncWorker';
import type { Platform } from '@prisma/client';

// POST /api/platforms/link
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const uid = cookieStore.get('arc-session')?.value;
    if (!uid) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const firebaseUser = await adminAuth.getUser(uid);
    if (!firebaseUser.email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    const user = await db.user.findUnique({ where: { email: firebaseUser.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

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
      where: { userId_platform: { userId: user.id, platform } },
      create: { userId: user.id, platform, handle, syncStatus: 'PENDING' },
      update: { handle, syncStatus: 'PENDING', syncError: null },
    });

    // Fire-and-forget sync
    syncPlatform(connection.id).catch(console.error);

    return NextResponse.json({ ok: true, connectionId: connection.id });
  } catch (err) {
    console.error('[platforms/link]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
