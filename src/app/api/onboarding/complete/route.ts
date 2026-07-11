import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// POST /api/onboarding/complete
// Saves CF/LC handles and marks the user as onboarded
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const uid = cookieStore.get('arc-session')?.value;
    if (!uid) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const firebaseUser = await adminAuth.getUser(uid);
    if (!firebaseUser.email) {
      return NextResponse.json({ error: 'No email on account' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: firebaseUser.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { displayName, cfHandle, lcUsername } = await request.json();

    // Update display name if provided
    if (displayName) {
      await db.user.update({
        where: { id: user.id },
        data: { displayName, onboarded: true },
      });
    } else {
      await db.user.update({
        where: { id: user.id },
        data: { onboarded: true },
      });
    }

    // Create platform connections if handles were provided
    if (cfHandle) {
      await db.platformConnection.upsert({
        where: { userId_platform: { userId: user.id, platform: 'CODEFORCES' } },
        create: { userId: user.id, platform: 'CODEFORCES', handle: cfHandle, syncStatus: 'PENDING' },
        update: { handle: cfHandle, syncStatus: 'PENDING', syncError: null },
      });
    }

    if (lcUsername) {
      await db.platformConnection.upsert({
        where: { userId_platform: { userId: user.id, platform: 'LEETCODE' } },
        create: { userId: user.id, platform: 'LEETCODE', handle: lcUsername, syncStatus: 'PENDING' },
        update: { handle: lcUsername, syncStatus: 'PENDING', syncError: null },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[onboarding/complete]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
