# Task 5 Brief: Topbar Indicator & Settings Read-Only Guarding

## Goal
Add a guest mode indicator in the Topbar, display an informative sticky preview banner across all Settings pages, and ensure mutation endpoints guard against guest modifications with clean 403 responses.

## Files to Modify

### 1. `src/lib/mock/data.ts`
Ensure `MOCK_PROFILE` includes `isGuest: true`:
```typescript
export const MOCK_PROFILE = {
  id: MOCK_SESSION_USER.id,
  email: MOCK_SESSION_USER.email,
  username: MOCK_SESSION_USER.username,
  avatarUrl: MOCK_SESSION_USER.avatarUrl,
  bio: 'Competitive programming enthusiast. CF + LC grind.',
  createdAt: new Date('2024-01-15').toISOString(),
  connectedPlatforms: ['CODEFORCES', 'LEETCODE', 'CODECHEF'],
  isGuest: true,
};
```

### 2. `src/components/layout/AppShell.tsx` and `src/components/layout/Topbar.tsx`
1. In `src/components/layout/AppShell.tsx`:
Pass `isGuest={profile?.isGuest ?? false}` to `Topbar`.
2. In `src/components/layout/Topbar.tsx`:
Add `isGuest?: boolean` to `TopbarProps`.
Between the GoalSetter/platform controls and notification bells, render the guest badge if `isGuest`:
```tsx
        {isGuest && (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Guest Preview</span>
            <a
              href="/signup?fresh=1"
              className="rounded px-2 py-0.5 text-[11px] font-bold text-black transition-colors bg-amber-400 hover:bg-amber-300"
            >
              Sign in
            </a>
          </div>
        )}
```

### 3. `src/components/layout/SettingsShell.tsx`
Fetch `profile` using `useQuery` or check `isGuest`.
Render an informative banner at the top of the settings content:
```tsx
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const isGuest = profile?.isGuest;
```
Inside `<main className="min-w-0 flex-1">`:
```tsx
        {isGuest && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <span>
                You are exploring settings in <strong>Guest Mode</strong>. Actions like connecting handles, updating profiles, and changing security credentials are read-only.
              </span>
            </div>
            <Link
              href="/signup?fresh=1"
              className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 font-bold text-black hover:bg-amber-300 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        )}
```

### 4. Guard Mutation APIs
In `src/app/api/platforms/link/route.ts`, `src/app/api/platforms/unlink/route.ts`, `src/app/api/platforms/sync/route.ts`, and `src/app/api/friends/requests/route.ts`:
Check:
```typescript
  if (session?.isGuest) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Guest account is read-only. Please create an account to save changes.' } },
      { status: 403 }
    );
  }
```

## Testing & Verification
1. Run `npm run build` to verify 0 type errors.
2. Commit: `git add src/lib/mock/data.ts src/components/layout/AppShell.tsx src/components/layout/Topbar.tsx src/components/layout/SettingsShell.tsx src/app/api/platforms/link/route.ts src/app/api/platforms/unlink/route.ts src/app/api/platforms/sync/route.ts src/app/api/friends/requests/route.ts ; git commit -m "feat: add topbar guest indicator, settings preview banner, and mutation guards"`
3. Write report to `docs/superpowers/tasks/task-5-report.md`.
