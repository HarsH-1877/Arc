# Guest Mode & Contest History Platform Line Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement visual platform badges for the 3 contest history sparkline charts, and build an end-to-end zero-latency Guest Mode accessible from the landing page with realistic mock data, real-time contest data, and read-only settings protections.

**Architecture:** A lightweight cookie-based guest session (`arc-guest=1`, `arc-session=guest`) bypasses Firebase auth, recognized by middleware and `getSession()`. API routes serve rich mock data across Codeforces, LeetCode, and CodeChef while fetching live upcoming contests directly via `fetchContestSchedule()`. Settings remain navigable but are safeguarded against mutations.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, React Query, GSAP.

## Global Constraints
- Minimal code changes, zero database writes for guest sessions.
- Preserve existing container dimensions (`min-h-[180px]`) in `CombinedRatingCard.tsx`.
- Real-time contest data must be fetched and served even in Guest Mode.
- All settings tabs remain visible to explore, but mutate actions are guarded.

---

### Task 1: Contest History 3-Line Graph Platform Badges

**Files:**
- Modify: `src/components/contest-history/CombinedRatingCard.tsx:110-145`

**Interfaces:**
- Consumes: `displayPlatforms: ('CODEFORCES' | 'LEETCODE' | 'CODECHEF')[]`, `chartData`, `PlatformLogo`.
- Produces: Visual platform indicator beside each line chart row in the multi-platform view.

- [ ] **Step 1: Update `CombinedRatingCard.tsx` layout**
In `src/components/contest-history/CombinedRatingCard.tsx`, update the chart mapping container so that each platform row has a dedicated left badge container with `<PlatformLogo platform={platform} size={13} />` and short code `CF`, `LC`, or `CC` styled in the platform color:

```tsx
        <div className="relative mt-1 min-h-[58px] w-full flex-1 -mx-1 -mb-1 flex flex-col gap-1">
          {displayPlatforms.map(platform => {
            const pData = chartData.filter(d => d.platform === platform);
            const color = platform === 'CODEFORCES' ? '#3b82f6' : platform === 'CODECHEF' ? '#b45309' : '#f59e0b';
            const label = platform === 'CODEFORCES' ? 'CF' : platform === 'CODECHEF' ? 'CC' : 'LC';
            return (
              <div key={platform} className="flex-1 min-h-0 w-full flex items-center gap-1.5 relative">
                {/* Platform badge label */}
                <div
                  className="flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono-data border leading-none"
                  style={{
                    background: `${color}15`,
                    borderColor: `${color}35`,
                    color,
                    minWidth: '42px',
                  }}
                  title={platform === 'CODEFORCES' ? 'Codeforces' : platform === 'CODECHEF' ? 'CodeChef' : 'LeetCode'}
                >
                  <PlatformLogo platform={platform} size={12} active={true} />
                  <span>{label}</span>
                </div>
                {/* Line chart */}
                <div className="flex-1 h-full min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={pData} 
                      onMouseMove={(e) => {
                        if (e.activePayload) setHovered(e.activePayload[0].payload);
                      }}
                      onMouseLeave={() => setHovered(null)}
                      margin={{ top: 2, right: 6, bottom: 2, left: 2 }}
                    >
                      <XAxis dataKey="year" hide />
                      <Tooltip 
                        content={<></>} 
                        cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '4 4' }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke={color} 
                        strokeWidth={2}
                        dot={{ r: 0, fill: color, strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: color, stroke: '#11131d', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
```

- [ ] **Step 2: Verify visually and run type check**
Run: `npm run build`
Expected: Build passes with 0 type errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/contest-history/CombinedRatingCard.tsx
git commit -m "feat: add platform logo badges to stacked contest history rating graphs"
```

---

### Task 2: Guest Mode Session & Authentication Route Layer

**Files:**
- Create: `src/app/api/auth/guest/route.ts`
- Modify: `src/middleware.ts:1-27`
- Modify: `src/lib/session.ts:1-58`

**Interfaces:**
- Produces: `/api/auth/guest` endpoint, sets guest cookies, allows middleware bypass, returns `SessionUser` with `isGuest: true`.

- [ ] **Step 1: Create `/api/auth/guest/route.ts`**
Create route handler that sets `arc-guest=1` and `arc-session=guest` and redirects to `/dashboard`:

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

- [ ] **Step 2: Update `src/middleware.ts`**
In `src/middleware.ts`, recognize `arc-guest` or `arc-session=guest`:

```typescript
  const isGuest = request.cookies.get('arc-guest')?.value === '1' || request.cookies.get('arc-session')?.value === 'guest';
  const isLoggedIn = !!sessionCookie || isGuest;
```

- [ ] **Step 3: Update `src/lib/session.ts`**
Extend `SessionUser` interface with `isGuest?: boolean;`.
In `getSession()`:
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

- [ ] **Step 4: Commit**
```bash
git add src/app/api/auth/guest/route.ts src/middleware.ts src/lib/session.ts
git commit -m "feat: add guest session route, middleware handler, and session resolver"
```

---

### Task 3: Landing Page Guest Mode Buttons

**Files:**
- Modify: `src/components/landing/LandingNav.tsx:86-121`
- Modify: `src/components/landing/Hero.tsx:98-118`

**Interfaces:**
- Consumes: `/api/auth/guest` endpoint.
- Produces: Guest Mode CTA button between "Sign in" and "Connect handle", and hero secondary link.

- [ ] **Step 1: Add Guest Mode button in `LandingNav.tsx`**
In `src/components/landing/LandingNav.tsx`, between `Sign in` link and `Connect handle` link:

```tsx
        <Link
          href="/login?fresh=1"
          className="landing-feature-link inline-flex h-9 items-center font-mono text-[11px] uppercase tracking-[0.08em]"
          style={{ color: '#8A8A85' }}
        >
          Sign in
        </Link>
        <Link
          href="/api/auth/guest"
          className="inline-flex h-9 items-center justify-center border px-3.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-all duration-150 hover:border-[#3B7DDB] hover:text-[#EDEAE4]"
          style={{
            borderColor: '#242426',
            borderRadius: 2,
            background: 'rgba(255,255,255,0.03)',
            color: '#A1A1AA',
          }}
          title="Try Project Arc instantly with demo data"
        >
          Guest Mode
        </Link>
        <Link
          ref={btnRef}
          href="/signup?fresh=1"
          ...
```

- [ ] **Step 2: Add secondary guest prompt in `Hero.tsx`**
In `src/components/landing/Hero.tsx`, next to or beneath the primary CTA:

```tsx
            <div className="flex flex-wrap items-center gap-4">
              <Link
                ref={ctaRef}
                href="/signup?fresh=1"
                className="landing-connect-link relative z-20 inline-flex items-center gap-3 border font-mono text-[13px] font-medium uppercase tracking-[0.1em] px-6 py-3.5 transition-all duration-150 self-start hover:brightness-110"
                style={{
                  background: 'var(--active-tier, #3B7DDB)',
                  borderColor: 'var(--active-tier, #3B7DDB)',
                  borderRadius: 2,
                  color: '#FFFFFF',
                  transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                Connect your handle
                <span
                  className="font-mono text-base"
                  style={{ color: '#FFFFFF', animation: 'blink 1s step-end infinite' }}
                >
                  _
                </span>
              </Link>
              <Link
                href="/api/auth/guest"
                className="relative z-20 inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] px-4 py-3 transition-colors text-[#8A8A85] hover:text-[#EDEAE4]"
              >
                Explore as Guest →
              </Link>
            </div>
```

- [ ] **Step 3: Commit**
```bash
git add src/components/landing/LandingNav.tsx src/components/landing/Hero.tsx
git commit -m "feat: add guest mode buttons to landing navbar and hero"
```

---

### Task 4: Mock Data Upgrade & Hybrid Real-Time Contests

**Files:**
- Modify: `src/lib/mock/data.ts`
- Modify: `src/app/api/contests/route.ts`
- Modify: `src/app/api/dashboard/route.ts`

**Interfaces:**
- Consumes: `fetchContestSchedule()`, `getSession()`.
- Produces: Live upcoming contests merged with rich mock profiles and CodeChef analytics for guests.

- [ ] **Step 1: Add CodeChef platform data to `MOCK_DASHBOARD` in `src/lib/mock/data.ts`**
In `src/lib/mock/data.ts`, add `codechef` to `MOCK_DASHBOARD.platforms`:
```typescript
    codechef: {
      handle: 'arcdev',
      syncStatus: 'SYNCED' as const,
      lastSyncedAt: daysAgo(0),
      syncError: null,
      currentRating: 1945,
      maxRating: 2010,
      stars: '4★',
      globalRank: 1240,
      countryRank: 310,
      totalSolved: 420,
    },
```
And add CodeChef to `MOCK_FRIENDS` and `getMockCompare`.

- [ ] **Step 2: Update `/api/contests/route.ts` to deliver real-time upcoming contests in Guest Mode**
In `src/app/api/contests/route.ts`, check if `session?.isGuest || USE_MOCK_DATA`:
Instead of returning empty `history` and `upcoming`, call `fetchContestSchedule()` to return real-time upcoming contests and calendar events, plus realistic mock contest history for CF, LC, and CC.

- [ ] **Step 3: Update `/api/dashboard/route.ts`**
In `src/app/api/dashboard/route.ts`, if `session?.isGuest`, return `MOCK_DASHBOARD` merged with live upcoming contests from `fetchContestSchedule()`.

- [ ] **Step 4: Commit**
```bash
git add src/lib/mock/data.ts src/app/api/contests/route.ts src/app/api/dashboard/route.ts
git commit -m "feat: enhance mock datasets with CodeChef and serve real-time contests in guest mode"
```

---

### Task 5: Topbar Indicator & Settings Read-Only Guarding

**Files:**
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/components/layout/SettingsShell.tsx`
- Modify: `src/app/api/platforms/link/route.ts`, `src/app/api/platforms/unlink/route.ts`, `src/app/api/platforms/sync/route.ts`

**Interfaces:**
- Consumes: `useSession()` / session API, `SettingsShell`.
- Produces: Topbar guest badge, settings banner, and 403 API guard against guest mutations.

- [ ] **Step 1: Add Guest Mode pill in `src/components/layout/Topbar.tsx`**
In `Topbar.tsx`, if the current session user is a guest, display a subtle badge:
```tsx
  {isGuest && (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span>Guest Preview</span>
      <Link href="/signup?fresh=1" className="underline hover:text-amber-200 ml-1">
        Sign in
      </Link>
    </div>
  )}
```

- [ ] **Step 2: Add sticky preview banner in `src/components/layout/SettingsShell.tsx`**
In `SettingsShell.tsx`, check if the user is a guest (via session query or cookie check). If guest, render a prominent informative banner at the top of the settings page:
```tsx
  {isGuest && (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-400 shrink-0" />
        <span>You are exploring settings in <strong>Guest Mode</strong>. Actions like linking accounts, updating profiles, and changing passwords are disabled.</span>
      </div>
      <Link href="/signup?fresh=1" className="ml-4 shrink-0 rounded-lg bg-amber-400 px-3 py-1 font-bold text-black hover:bg-amber-300 transition-colors">
        Create Account
      </Link>
    </div>
  )}
```

- [ ] **Step 3: Guard mutation APIs against guest requests**
In `/api/platforms/link/route.ts`, `/api/platforms/unlink/route.ts`, `/api/platforms/sync/route.ts`, and `/api/user/profile/route.ts`:
Check `if (session.isGuest) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Guest account is read-only. Please create an account to save changes.' } }, { status: 403 });`

- [ ] **Step 4: Commit**
```bash
git add src/components/layout/Topbar.tsx src/components/layout/SettingsShell.tsx src/app/api/platforms/link/route.ts src/app/api/platforms/unlink/route.ts src/app/api/platforms/sync/route.ts
git commit -m "feat: add topbar guest indicator, settings preview banner, and mutation guards"
```

---

### Task 6: Verification & Production Build Check

**Files:**
- Full codebase

- [ ] **Step 1: Run production build check**
Run: `npm run build`
Expected: 0 TypeScript errors, all static & dynamic routes compile cleanly.

- [ ] **Step 2: Test Guest Flow**
- Hit `/api/auth/guest` -> verify redirect to `/dashboard`.
- Verify Dashboard renders CodeChef, Codeforces, and LeetCode cards.
- Verify Contest Calendar shows real-time upcoming contests.
- Verify Contest History shows all 3 platforms with labeled logos (`CF`, `LC`, `CC`).
- Verify Settings page displays the guest banner.

- [ ] **Step 3: Commit final integration verification**
```bash
git commit --allow-empty -m "chore: verify guest mode and contest labels integration passes build"
```
