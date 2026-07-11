import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { USE_MOCK_DATA, MOCK_PROFILE } from '@/lib/mock';

export async function GET() {
  if (USE_MOCK_DATA) return NextResponse.json(MOCK_PROFILE);

  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json(user);
  } catch (err) {
    console.error('[GET /api/user/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (USE_MOCK_DATA) {
    const body = await req.json();
    return NextResponse.json({ ...MOCK_PROFILE, ...body });
  }

  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { displayName, bio } = await req.json();

    const updatedUser = await db.user.update({
      where: { id: session.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
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
