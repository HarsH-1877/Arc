import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get('identifier')?.trim();

  if (!identifier) {
    return NextResponse.json({ error: 'Identifier required' }, { status: 400 });
  }

  if (identifier.includes('@')) {
    return NextResponse.json({ email: identifier.toLowerCase() });
  }

  if (!USERNAME_RE.test(identifier)) {
    return NextResponse.json({ error: 'Invalid Arc ID' }, { status: 400 });
  }

  const normalized = identifier.toLowerCase();
  const user = await db.user.findUnique({
    where: { username: normalized },
    select: { email: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Arc ID not found' }, { status: 404 });
  }

  // Arc passwords are linked to the synthetic Firebase email used during signup.
  return NextResponse.json({ email: `${normalized}@arc.local` });
}
