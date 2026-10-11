# Task 2 Brief: Guest Mode Session & Authentication Route Layer

## Goal
Implement the guest session handler route, update middleware to recognize guest cookies, and update `getSession()` to return a valid guest user session with `isGuest: true`.

## Files to Create / Modify

### 1. Create: `src/app/api/auth/guest/route.ts`
Creates a GET route that sets the cookies and redirects to `/dashboard`:
```typescript
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
```

### 2. Modify: `src/middleware.ts`
In `src/middleware.ts`:
Check if `arc-guest` cookie is `'1'` or `arc-session` cookie is `'guest'`:
```typescript
  const isGuest = request.cookies.get('arc-guest')?.value === '1' || request.cookies.get('arc-session')?.value === 'guest';
  const isLoggedIn = !!sessionCookie || isGuest;
```
Ensure that if `isLoggedIn` is true (including guest), it allows protected routes (`/dashboard`, `/compare`, `/friends`, `/settings`, `/problems`, `/contest-history`) to pass without redirecting to `/login`.

### 3. Modify: `src/lib/session.ts`
In `src/lib/session.ts`:
1. Extend `SessionUser` interface with `isGuest?: boolean;`.
2. In `getSession()`:
Check cookies before Firebase verification:
```typescript
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
```
If not guest, proceed with existing Firebase cookie verification.

## Testing & Verification
1. Run `npm run build` to verify 0 type errors.
2. Commit: `git add src/app/api/auth/guest/route.ts src/middleware.ts src/lib/session.ts ; git commit -m "feat: add guest session route, middleware handler, and session resolver"`
3. Write report to `docs/superpowers/tasks/task-2-report.md`.
