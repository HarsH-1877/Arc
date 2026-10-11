import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = new URL('/dashboard', url.origin);

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set('arc-guest', '1', {
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
    httpOnly: false,
  });

  response.cookies.set('arc-session', 'guest', {
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    httpOnly: true,
  });

  return response;
}
