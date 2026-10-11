import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { USE_MOCK_DATA, MOCK_PROFILE } from '@/lib/mock';
import { adminAuth } from '@/lib/firebase/server';

export async function GET() {
  const session = await getSession();
  if (session?.isGuest || USE_MOCK_DATA) return NextResponse.json(MOCK_PROFILE);

  try {
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        platforms: { select: { platform: true } },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      ...user,
      connectedPlatforms: user.platforms.map((connection) => connection.platform),
    });
  } catch (err) {
    console.error('[GET /api/user/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (session?.isGuest || USE_MOCK_DATA) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('arc-session', '', { path: '/', maxAge: 0 });
    response.cookies.set('arc-guest', '', { path: '/', maxAge: 0 });
    return response;
  }

  try {
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const firebaseUser = await adminAuth.getUserByEmail(session.email).catch(() => null);
    if (firebaseUser) await adminAuth.deleteUser(firebaseUser.uid);
    await db.user.delete({ where: { id: session.id } });

    const response = NextResponse.json({ ok: true });
    response.cookies.set('arc-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (err) {
    console.error('[DELETE /api/user/profile]', err);
    return NextResponse.json({ error: 'Could not delete account' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (session?.isGuest || USE_MOCK_DATA) {
    const body = await req.json();
    return NextResponse.json({ ...MOCK_PROFILE, ...body });
  }

  try {
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { bio } = await req.json();

    const updatedUser = await db.user.update({
      where: { id: session.id },
      data: {
        ...(bio !== undefined && { bio }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error('[PATCH /api/user/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
