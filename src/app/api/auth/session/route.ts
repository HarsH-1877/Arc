import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/utils';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

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
  const requestedUsername = requested?.toLowerCase();
  if (requestedUsername && USERNAME_RE.test(requestedUsername)) {
    const taken = await db.user.findUnique({ where: { username: requestedUsername } });
    if (!taken) return requestedUsername;
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
    const { idToken, username: requestedUsername, onboard = false } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: { code: 'MISSING_TOKEN', message: 'ID token required' } }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { email } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: { code: 'NO_EMAIL', message: 'No email on token' } }, { status: 400 });
    }

    let user = await db.user.findUnique({ where: { email } });
    const isNewUser = !user;

    if (!user) {
      const username = await resolveUsername(email, requestedUsername);
      user = await db.user.create({
        data: {
          email,
          username,
          displayName: decodedToken.name ?? username,
          avatarUrl: decodedToken.picture ?? null,
          onboarded: Boolean(onboard),
        },
      });
    } else {
      const updates: { avatarUrl?: string; username?: string; displayName?: string } = {};

      if (decodedToken.picture && decodedToken.picture !== user.avatarUrl) {
        updates.avatarUrl = decodedToken.picture;
      }

      if (requestedUsername && USERNAME_RE.test(requestedUsername.toLowerCase())) {
        const normalized = requestedUsername.toLowerCase();
        const taken = await db.user.findUnique({ where: { username: normalized } });
        if (!taken || taken.id === user.id) {
          updates.username = normalized;
          updates.displayName = normalized;
        }
      }

      if (Object.keys(updates).length > 0) {
        user = await db.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    }

    if (onboard && !user.onboarded) {
      user = await db.user.update({
        where: { id: user.id },
        data: { onboarded: true },
      });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
    const response = NextResponse.json({
      ok: true,
      onboarded: user.onboarded,
      userId: user.id,
      isNewUser,
    });

    response.cookies.set('arc-session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000,
    });

    return response;
  } catch (error) {
    logger.error('[session]', error);
    const firebaseError = error as { code?: string; message?: string };
    const isTokenError = firebaseError.code?.startsWith('auth/') || firebaseError.message?.toLowerCase().includes('token');
    return NextResponse.json(
      {
        error: {
          code: isTokenError ? 'INVALID_TOKEN' : 'SESSION_SETUP_FAILED',
          message: isTokenError
            ? 'Google could not verify this sign-in. Please try again.'
            : 'Arc could not start a secure session. Check the Firebase server credentials and try again.',
        },
      },
      { status: isTokenError ? 401 : 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('arc-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
