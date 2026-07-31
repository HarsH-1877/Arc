import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getCFUser } from '@/lib/fetchers/codeforces';
import { getLCSolvedStats } from '@/lib/fetchers/leetcode';
import { syncPlatform } from '@/workers/syncWorker';

const HANDLE_RE = /^[a-zA-Z0-9_-]{1,24}$/;

// POST /api/onboarding/complete
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { displayName, cfHandle, lcUsername } = await request.json();

    if (cfHandle && !HANDLE_RE.test(cfHandle)) {
      return NextResponse.json({ error: 'Invalid Codeforces handle format.' }, { status: 400 });
    }

    if (lcUsername && !HANDLE_RE.test(lcUsername)) {
      return NextResponse.json({ error: 'Invalid LeetCode username format.' }, { status: 400 });
    }

    if (displayName) {
      await db.user.update({
        where: { id: session.id },
        data: { displayName, onboarded: true },
      });
    } else {
      await db.user.update({
        where: { id: session.id },
        data: { onboarded: true },
      });
    }

    const connections = [];

    if (cfHandle) {
      try {
        await getCFUser(cfHandle);
      } catch {
        return NextResponse.json({ error: 'Codeforces handle not found.' }, { status: 422 });
      }

      const taken = await db.platformConnection.findFirst({
        where: {
          platform: 'CODEFORCES',
          handle: cfHandle,
          userId: { not: session.id },
        },
      });
      if (taken) {
        return NextResponse.json({ error: 'This Codeforces handle is already linked to another Arc account.' }, { status: 409 });
      }

      connections.push(await db.platformConnection.upsert({
        where: { userId_platform: { userId: session.id, platform: 'CODEFORCES' } },
        create: { userId: session.id, platform: 'CODEFORCES', handle: cfHandle, syncStatus: 'PENDING' },
        update: { handle: cfHandle, syncStatus: 'PENDING', syncError: null },
      }));
    }

    if (lcUsername) {
      try {
        await getLCSolvedStats(lcUsername);
      } catch {
        return NextResponse.json({ error: 'LeetCode username not found.' }, { status: 422 });
      }

      const taken = await db.platformConnection.findFirst({
        where: {
          platform: 'LEETCODE',
          handle: lcUsername,
          userId: { not: session.id },
        },
      });
      if (taken) {
        return NextResponse.json({ error: 'This LeetCode username is already linked to another Arc account.' }, { status: 409 });
      }

      connections.push(await db.platformConnection.upsert({
        where: { userId_platform: { userId: session.id, platform: 'LEETCODE' } },
        create: { userId: session.id, platform: 'LEETCODE', handle: lcUsername, syncStatus: 'PENDING' },
        update: { handle: lcUsername, syncStatus: 'PENDING', syncError: null },
      }));
    }

    // Keep initial imports bound to this setup request so the persisted state
    // always becomes SYNCED or ERROR instead of being abandoned as SYNCING.
    await Promise.allSettled(connections.map((connection) => syncPlatform(connection.id, { quick: true })));

    return NextResponse.json({ ok: true, syncing: false });
  } catch (error) {
    console.error('[onboarding/complete]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
