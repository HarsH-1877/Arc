import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/auth/check-username?username=foo
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');

  if (!username) {
    return NextResponse.json({ available: false, error: 'Username required' }, { status: 400 });
  }

  // Validate format
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json({ available: false, error: 'Invalid username format' });
  }

  const existing = await db.user.findUnique({
    where: { username },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
