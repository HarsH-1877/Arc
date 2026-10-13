import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// GET /api/auth/status — lightweight session check for client routing
export async function GET() {
  const session = await getSession();
  if (!session || session.isGuest) {
    return NextResponse.json({ authenticated: false, isGuest: Boolean(session?.isGuest) });
  }

  return NextResponse.json({
    authenticated: true,
    onboarded: session.onboarded,
    username: session.username,
    isGuest: false,
  });
}
