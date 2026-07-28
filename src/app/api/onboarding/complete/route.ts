import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { syncPlatform } from '@/workers/syncWorker';

// POST /api/onboarding/complete
// Saves CF/LC handles and marks the user as onboarded
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { displayName, cfHandle, lcUsername } = await request.json();

    // Update display name if provided
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

    // Create platform connections if handles were provided
    const connections = [];
    if (cfHandle) {
      connections.push(await db.platformConnection.upsert({
        where: { userId_platform: { userId: session.id, platform: 'CODEFORCES' } },
        create: { userId: session.id, platform: 'CODEFORCES', handle: cfHandle, syncStatus: 'PENDING' },
        update: { handle: cfHandle, syncStatus: 'PENDING', syncError: null },
      }));
    }

    if (lcUsername) {
      connections.push(await db.platformConnection.upsert({
        where: { userId_platform: { userId: session.id, platform: 'LEETCODE' } },
        create: { userId: session.id, platform: 'LEETCODE', handle: lcUsername, syncStatus: 'PENDING' },
        update: { handle: lcUsername, syncStatus: 'PENDING', syncError: null },
      }));
    }

    await Promise.allSettled(connections.map((connection) => syncPlatform(connection.id)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[onboarding/complete]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
