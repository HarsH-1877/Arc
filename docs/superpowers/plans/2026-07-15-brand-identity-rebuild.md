# Arc Brand Identity Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Arc's entire visual identity from a single token system, fix chart bugs, and apply consistent brand/semantic color law across every app screen.

**Architecture:** CSS custom properties in `src/styles/tokens.css` are the single source of truth. All components migrate from ad-hoc accent hues to `--brand`, `--success`, `--danger`, `--warning`, and neutral grays. Chart components share domain/tick utilities. Compare stats use a duel-bar pattern inspired by 21st.dev stacked-diverging-bar (adapted to Recharts/CSS, no new deps).

**Tech Stack:** Next.js, React, Tailwind CSS, Recharts, Framer Motion, 21st.dev reference patterns

## Global Constraints

- Do not change API calls, data-fetching logic, or routing
- Do not change TypeScript types or prop interfaces
- Every color outside `:root` must use a design token — no raw hex in components
- `--brand: #4f6ef7` is the only signature hue; friends/charts use `--gray-400`
- Rank badges: gold `#d4a94a`, silver `--gray-300`, bronze `#b8703f`, 4+ `--gray-700`
- Lighthouse accessibility score must stay ≥ 90
- Motion applied last, after static layouts are final

---

### Task 1: Design Tokens

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/app/globals.css`

- [ ] Replace accent palette with brand + semantic + true neutral grays
- [ ] Add compatibility aliases (`--accent-blue` → `--brand`) for gradual migration
- [ ] Remove page gradient mesh from `body::before`
- [ ] Update rank-badge CSS classes to gold/silver/bronze law
- [ ] Add `.tabular-nums` utility class

### Task 2: Chart Bug Fixes

**Files:**
- Modify: `src/components/charts/RatingChart.tsx`
- Modify: `src/components/charts/CompareRatingChart.tsx`
- Modify: `src/components/dashboard/ProblemDistributionCard.tsx`
- Modify: `src/components/dashboard/HeroStats.tsx`

- [ ] Y-axis: compute `[dataMin, dataMax]` domain with padding — strictly ascending
- [ ] X-axis: deduplicate month ticks
- [ ] Tier labels: reserve top margin lane, prevent overlap/clipping
- [ ] Y-axis width: fix Compare clipping (`width={56}`)
- [ ] CF histogram: sequential buckets 800-1199 / 1200-1599 / 1600-1999 / 2000+
- [ ] Growth Insight: single primary pill only

### Task 3: Global Shell

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/components/layout/GoalSetter.tsx`
- Modify: `src/components/shared/PlatformLogo.tsx`

### Task 4–8: Page passes

See spec sections §5–§10 for Dashboard, Friends, Compare, Contest History, Settings, Motion.
