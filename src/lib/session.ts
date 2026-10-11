import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/server';
import { db } from '@/lib/db';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  onboarded: boolean;
  isGuest?: boolean;
}

import { USE_MOCK_DATA, MOCK_SESSION_USER } from '@/lib/mock';

/**
 * Server-side session helper (use in Server Components and Route Handlers).
 * Reads the Firebase session cookie, verifies it with Firebase Admin SDK,
 * then fetches the user from Postgres.
 *
 * Returns null if unauthenticated or if the token is invalid.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const isGuest = cookieStore.get('arc-guest')?.value === '1' || cookieStore.get('arc-session')?.value === 'guest';
    if (isGuest) {
      return {
        id: 'guest-user',
        email: 'guest@projectarc.app',
        username: 'Guest Explorer',
        avatarUrl: null,
        onboarded: true,
        isGuest: true,
      };
    }
  } catch {
    // cookies() unavailable outside request context
  }

  if (USE_MOCK_DATA) {
    return {
      id: MOCK_SESSION_USER.id,
      email: MOCK_SESSION_USER.email,
      username: MOCK_SESSION_USER.username,
      avatarUrl: MOCK_SESSION_USER.avatarUrl,
      onboarded: true,
    };
  }

  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('arc-session')?.value;
    if (!sessionCookie) return null;

    // checkRevoked protects authenticated routes after a user disables their account
    // or explicitly revokes their Firebase sessions.
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (!decodedToken.email) return null;

    const user = await db.user.findUnique({
      where: { email: decodedToken.email },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        onboarded: true,
      },
    });

    return user as SessionUser | null;
  } catch {
    return null;
  }
}

/**
 * Like getSession() but redirects to /login if unauthenticated.
 * Use this in protected Server Components.
 */
export async function requireSession(): Promise<SessionUser> {
  const { redirect } = await import('next/navigation');
  const session = await getSession();
  if (!session) {
    redirect('/login');
    throw new Error('Redirecting to login'); // Satisfies TS return type
  }
  return session;
}
