import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/server';
import { db } from '@/lib/db';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  onboarded: boolean;
}

import { USE_MOCK_DATA, MOCK_SESSION_USER } from '@/lib/mock';

/**
 * Server-side session helper (use in Server Components and Route Handlers).
 * Reads the arc-session cookie (which holds the Firebase UID), verifies it
 * with Firebase Admin SDK, then fetches the user from our Postgres DB.
 *
 * Returns null if unauthenticated or if the token is invalid.
 */
export async function getSession(): Promise<SessionUser | null> {
  if (USE_MOCK_DATA) {
    return {
      id: MOCK_SESSION_USER.id,
      email: MOCK_SESSION_USER.email,
      username: MOCK_SESSION_USER.username,
      displayName: MOCK_SESSION_USER.displayName,
      avatarUrl: MOCK_SESSION_USER.avatarUrl,
      onboarded: true,
    };
  }

  try {
    const cookieStore = cookies();
    const uid = cookieStore.get('arc-session')?.value;
    if (!uid) return null;

    // Verify the UID is still valid in Firebase (catches revoked accounts)
    const firebaseUser = await adminAuth.getUser(uid);
    if (!firebaseUser.email) return null;

    const user = await db.user.findUnique({
      where: { email: firebaseUser.email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
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
