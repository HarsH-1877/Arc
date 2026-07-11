import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/utils';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

async function ensureUniqueUsername(base: string): Promise<string> {
  let username = base;
  let suffix = 0;
  while (await db.user.findUnique({ where: { username } })) {
    suffix += 1;
    username = `${base.slice(0, 12)}_${suffix}`;
  }
  return username;
}

async function resolveUsername(email: string, requested?: string): Promise<string> {
  if (requested && USERNAME_RE.test(requested)) {
    const taken = await db.user.findUnique({ where: { username: requested } });
    if (!taken) return requested;
  }

  const base = email
    .split('@')[0]
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .slice(0, 15);

  return ensureUniqueUsername(base || 'user');
}

// POST /api/auth/session — verify Firebase token and set session cookie
export async function POST(request: NextRequest) {
  try {
    const { idToken, username: requestedUsername } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: { code: 'MISSING_TOKEN', message: 'ID token required' } }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: { code: 'NO_EMAIL', message: 'No email on token' } }, { status: 400 });
    }

    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      const username = await resolveUsername(email, requestedUsername);
      user = await db.user.create({
        data: {
          email,
          username,
          displayName: decodedToken.name ?? username,
          avatarUrl: decodedToken.picture ?? null,
        },
      });
    } else if (decodedToken.picture && decodedToken.picture !== user.avatarUrl) {
      user = await db.user.update({
        where: { id: user.id },
        data: { avatarUrl: decodedToken.picture },
      });
    }

    const response = NextResponse.json({
      ok: true,
      onboarded: user.onboarded,
      userId: user.id,
    });

    response.cookies.set('arc-session', uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch (error) {
    logger.error('[session]', error);
    return NextResponse.json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token' } }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('arc-session');
  return response;
}
