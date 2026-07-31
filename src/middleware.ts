import { NextRequest, NextResponse } from 'next/server';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

const PROTECTED_PREFIXES = ['/dashboard', '/compare', '/friends', '/settings', '/onboarding', '/link-account', '/contest-history'];

export async function middleware(request: NextRequest) {
  if (USE_MOCK) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const sessionCookie = request.cookies.get('arc-session')?.value;
  const isLoggedIn = !!sessionCookie;

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Only auto-redirect away from login — signup handles existing sessions itself
  if (isLoggedIn && pathname.startsWith('/login') && request.nextUrl.searchParams.get('fresh') !== '1') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/compare/:path*',
    '/friends/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/link-account/:path*',
    '/contest-history/:path*',
    '/login',
    '/signup',
  ],
};
