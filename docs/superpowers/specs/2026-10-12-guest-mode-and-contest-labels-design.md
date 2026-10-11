# Design Spec: Guest Mode & Contest History Platform Line Labels

**Date:** 2026-10-12  
**Status:** Approved by User  

---

## 1. Overview
This specification covers two key enhancements to Project Arc:
1. **Contest History All-Platform Graph Labeling:** When "All Platforms" is selected in the Contest History page, the 3 vertically stacked rating graphs must each clearly display the platform logo and short identifier (CF, LC, CC) with clean UI.
2. **Guest Mode Feature:** A direct-entry guest mode accessible from the landing page (between "Sign in" and "Connect handle") that routes users straight to the dashboard with realistic mock data across all 3 platforms, full read access across all features, real-time live contest data, and read-only protections across settings.

---

## 2. Contest History All-Platform Graph Labeling

### 2.1 Component: `CombinedRatingCard.tsx`
- Currently, when `selectedPlatform === 'ALL'`, 3 sparkline charts are rendered vertically inside a flex column with colors `#3b82f6` (CF), `#f59e0b` (LC), and `#b45309` (CC), but there are no visual indicators identifying which line belongs to which platform.
- **Solution:**
  - For each platform row in `displayPlatforms.map(...)`, render a 2-column flex item:
    - **Left Badge (48px fixed width):**
      - Displays `<PlatformLogo platform={platform} size={14} />` alongside a compact platform text abbreviation (`CF`, `LC`, `CC`).
      - Styled in a subtle rounded pill with platform accent color text and faint border.
    - **Right Chart Area (flex-1):**
      - The `ResponsiveContainer` and `LineChart` for that platform.
      - Maintains synchronized hover state (`setHovered(payload)`) to update the top summary values (contest name, date, rating, rank, solved count).
  - Preserves container height (`min-h-[180px]`) and visual balance without clipping.

---

## 3. Guest Mode Architecture

### 3.1 Authentication & Session Handling
- **Entry Point:**
  - In `LandingNav.tsx`, add a "Guest Mode" button between "Sign in" and "Connect handle":
    - Visual style: Monospace clean button, matching dark cyberpunk aesthetic with faint border (`#242426`) and hover highlight.
    - Action: Navigates to `/api/auth/guest`.
  - In `Hero.tsx`, add a subtle secondary link: "Explore in Guest Mode →".
- **Route Handler `/api/auth/guest`:**
  - Sets cookies:
    - `arc-guest=1` (Path `/`, Max-Age 86400).
    - `arc-session=guest` (Path `/`, Max-Age 86400).
  - Redirects 302 to `/dashboard`.
- **Middleware `src/middleware.ts`:**
  - Checks if `arc-guest === '1'` or `arc-session === 'guest'`.
  - Allows immediate access through all protected paths (`/dashboard`, `/compare`, `/friends`, `/settings`, `/problems`, `/contest-history`).
- **Server Session `src/lib/session.ts`:**
  - `getSession()` checks for the guest cookie or `arc-session === 'guest'`.
  - Returns a `SessionUser` object:
    ```typescript
    {
      id: 'guest-user',
      email: 'guest@projectarc.app',
      username: 'Guest Explorer',
      avatarUrl: null,
      onboarded: true,
      isGuest: true,
    }
    ```
- **Exit / Sign In Conversion:**
  - If a guest clicks "Sign in" or "Connect handle", regular authentication overwrites the session cookie and removes `arc-guest`.

### 3.2 Visual Guest Indicators
- **Topbar Banner/Pill:**
  - When session is guest, render a compact guest pill in the Topbar:
    - `[Eye Icon] Guest Mode` with a high-contrast `Sign in` / `Create Account` link.
    - Unobtrusive and does not obstruct any core dashboard interactions.

### 3.3 Data Layer (Hybrid Mock & Live)
- **Real-Time Contests (`/api/contests`):**
  - **Requirement:** User explicitly requested real-time data for contests so the platform feels alive.
  - When in guest mode, `/api/contests` calls `fetchContestSchedule()` to fetch live upcoming contests directly from Codeforces, LeetCode, and CodeChef APIs.
  - Generates realistic past contest history for CF, LC, and CC so charts and history tables are fully populated and interactive.
- **Dashboard (`/api/dashboard`):**
  - Populates `MOCK_DASHBOARD` with CodeChef (ratings, 4★, questions solved, rank) alongside Codeforces and LeetCode.
  - Supplies heatmaps, rating charts, and recent activity.
  - Integrates the live upcoming contests.
- **Compare (`/api/compare`):**
  - Allows comparing against pre-seeded profiles (`tourist`, `jiangly`, `benq`, `neal`) across all 3 platforms.
- **Friends (`/api/friends`):**
  - Pre-seeded friend list with active ratings, streaks, and mock activity.
- **Problems (`/api/problems`):**
  - Returns problem listing with filters for platform, tags, difficulty.

### 3.4 Settings Access & Mutation Guarding
- **Access Rule:** As approved by user, all settings tabs (Profile, Connections, Notifications, Security, Danger Zone) remain visible and navigable so guests can inspect full platform functionality.
- **Guard Mechanism:**
  - In `SettingsShell.tsx`, display a sticky top notice:
    `"Guest Mode — Settings are in preview mode. Sign in to link accounts or customize preferences."`
  - On mutating endpoints:
    - `/api/platforms/link`, `/api/platforms/unlink`, `/api/platforms/sync`
    - `/api/user/profile`
    - `/api/friends/requests`, `/api/friends/[id]`
    - If `session.isGuest === true`, reject mutations with a 403 response `{ error: 'Guest mode is read-only. Please sign in to save changes.' }`.
  - On the client side, mutation buttons (e.g. "Save changes", "Link handle", "Delete account") show a toast or alert prompt explaining that an account is required.

---

## 4. Verification & Testing Plan
1. **Contest History Page:**
   - Switch to "All Platforms" in top dropdown.
   - Verify that 3 lines have clear badges (CF, LC, CC) with platform logos.
   - Verify hover interaction displays correct contest data.
2. **Landing Page:**
   - Verify "Guest Mode" button exists between "Sign in" and "Connect handle" in navbar.
   - Click "Guest Mode" -> verify instant redirect to `/dashboard`.
3. **Guest Session Flow:**
   - Verify Dashboard renders full mock data with CF, LC, and CC.
   - Verify real-time upcoming contests are present and updated.
   - Navigate to Compare, Problems, Friends -> verify all render smoothly.
   - Navigate to Settings -> verify all tabs can be opened, notice banner is shown, and save actions are safely guarded.
4. **Build & Type Check:**
   - Run `npm run build` to confirm zero TypeScript or bundler errors.
