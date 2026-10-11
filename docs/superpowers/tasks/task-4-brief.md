# Task 4 Brief: Mock Data Upgrade & Hybrid Real-Time Contests

## Goal
Enrich the mock dataset with full CodeChef support (dashboard platform stats, compare stats, friends stats) and update the API routes (`/api/contests` and `/api/dashboard`) so that guest/mock sessions fetch **real-time live upcoming contests** from Codeforces, LeetCode, and CodeChef alongside rich historical analytics.

## Files to Modify

### 1. `src/lib/mock/data.ts`
1. In `MOCK_DASHBOARD.platforms`, add CodeChef:
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
2. In `MOCK_FRIENDS`:
Add `ccRating` to friends (e.g. 2100, 1950, 1820, etc.).
3. In `getMockCompare(friendId: string)`:
Add `ccHandle: 'arcdev'`, `ccRating: 1945`, `ccMaxRating: 2010`, `ccStars: '4★'`, `ccSolvedCount: 420`, `ccContestCount: 24`, and `ccRatingHistory: genRatingHistory(1945, 30)` to `user`.
Add `ccHandle: friend.username, ccRating: friend.ccRating ?? 1850, ccMaxRating: (friend.ccRating ?? 1850) + 60, ccStars: '4★', ccSolvedCount: 380, ccContestCount: 20`, and `ccRatingHistory: genRatingHistory(friend.ccRating ?? 1850, 35)` to `friend`.
Add `ccRating` winner check to `verdict`.

### 2. `src/app/api/contests/route.ts`
When `session?.isGuest || USE_MOCK_DATA`:
Instead of returning empty arrays, call `const fullSchedule = await fetchContestSchedule();`.
Return:
- `history`: A rich multi-platform contest history array (CF, LC, CC) with rating movements, ranks, solved counts, so all 3 sparklines and history tables render beautifully. Include at least 8-10 historical contests across CODEFORCES, LEETCODE, and CODECHEF.
- `upcoming`: `fullSchedule` (real-time contests directly from CF, LC, CC APIs).
- `calendarEvents`: `buildContestCalendarEvents(history, fullSchedule)`.
- `bestByPlatform`: best contest per platform.
- `stats`: `{ totalContests: history.length, avgRank: <average rank>, bestGain: <max rating gain> }`.

### 3. `src/app/api/dashboard/route.ts`
In `GET /api/dashboard`:
Check if `session?.isGuest || USE_MOCK_DATA`.
If guest/mock:
Fetch live schedule:
```typescript
  const schedule = await fetchContestSchedule().catch(() => []);
```
Return `MOCK_DASHBOARD` with `upcomingContests` populated with `schedule.slice(0, 5)` (or mapped to upcoming format).

### 4. `src/app/api/user/profile/route.ts`
If `session?.isGuest || USE_MOCK_DATA`, return `MOCK_PROFILE`.

## Testing & Verification
1. Run `npm run build` to verify 0 type errors.
2. Commit: `git add src/lib/mock/data.ts src/app/api/contests/route.ts src/app/api/dashboard/route.ts src/app/api/user/profile/route.ts ; git commit -m "feat: enhance mock datasets with CodeChef and serve real-time contests in guest mode"`
3. Write report to `docs/superpowers/tasks/task-4-report.md`.
