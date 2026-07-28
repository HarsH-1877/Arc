import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { db } from '@/lib/db';

// POST /api/auth/precheck — verify Google token and look up account WITHOUT creating a session
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.email) {
      return NextResponse.json({ error: 'No email on token' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: decoded.email },
      select: { onboarded: true },
    });

    return NextResponse.json({
      exists: Boolean(user),
      onboarded: user?.onboarded ?? false,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
