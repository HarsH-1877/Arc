import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import type { Platform } from '@prisma/client';

// DELETE /api/platforms/unlink
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const uid = cookieStore.get('arc-session')?.value;
    if (!uid) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const firebaseUser = await adminAuth.getUser(uid);
    if (!firebaseUser.email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    const user = await db.user.findUnique({ where: { email: firebaseUser.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { platform } = await request.json() as { platform: Platform };
    if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

    await db.platformConnection.deleteMany({
      where: { userId: user.id, platform },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[platforms/unlink]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
