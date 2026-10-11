# Task 5 Report: Topbar Indicator & Settings Read-Only Guarding

## Status
**DONE**

## Summary
Implemented guest mode visual indicators in the topbar and settings shell, and guarded all core mutation endpoints against unauthorized guest write operations with structured 403 Forbidden responses.

## Changes Made
1. **Mock Data Profile** ([`src/lib/mock/data.ts`](file:///e:/Projects/Project%20Arc/src/lib/mock/data.ts))
   - Updated `MOCK_PROFILE` to explicitly include `isGuest: true`.

2. **App Shell** ([`src/components/layout/AppShell.tsx`](file:///e:/Projects/Project%20Arc/src/components/layout/AppShell.tsx))
   - Passed `isGuest={profile?.isGuest ?? false}` prop from the query profile data down to `<Topbar>`.

3. **Topbar Guest Badge** ([`src/components/layout/Topbar.tsx`](file:///e:/Projects/Project%20Arc/src/components/layout/Topbar.tsx))
   - Added `isGuest?: boolean` to `TopbarProps` interface.
   - Rendered the amber pulsed `Guest Preview` pill badge with a direct `Sign in` link between platform controls and notification bells when `isGuest` is true.

4. **Settings Read-Only Preview Banner** ([`src/components/layout/SettingsShell.tsx`](file:///e:/Projects/Project%20Arc/src/components/layout/SettingsShell.tsx))
   - Fetched `/api/user/profile` via TanStack `useQuery`.
   - Rendered an informative amber preview banner with `AlertTriangle` icon and a `Create Free Account` call to action at the top of the settings content area when `isGuest` is true.

5. **Mutation Endpoint Guards**
   - [`src/app/api/platforms/link/route.ts`](file:///e:/Projects/Project%20Arc/src/app/api/platforms/link/route.ts): Added `if (session?.isGuest)` guard returning 403 `{ error: { code: 'FORBIDDEN', message: 'Guest account is read-only. Please create an account to save changes.' } }`.
   - [`src/app/api/platforms/unlink/route.ts`](file:///e:/Projects/Project%20Arc/src/app/api/platforms/unlink/route.ts): Added `if (session?.isGuest)` guard returning 403 with the forbidden error payload.
   - [`src/app/api/platforms/sync/route.ts`](file:///e:/Projects/Project%20Arc/src/app/api/platforms/sync/route.ts): Added `if (session?.isGuest)` guard returning 403 with the forbidden error payload.
   - [`src/app/api/friends/requests/route.ts`](file:///e:/Projects/Project%20Arc/src/app/api/friends/requests/route.ts): Added `if (session?.isGuest)` guard in the `PATCH` handler returning 403 with the forbidden error payload.

## Verification
- Verified TypeScript types across all 8 files.
- Executed git commit: `c802ef1e5c82d771f616f6fc44b3b504896325e2`.
- Git status verified clean for the task files.

## Git Commits
- Commit: `c802ef1e5c82d771f616f6fc44b3b504896325e2`
- Message: `feat: add topbar guest indicator, settings preview banner, and mutation guards`
