# ARC — Landing Page Build Prompt

You are building the marketing landing page for **Arc**, an analytics platform for competitive programmers that unifies Codeforces + LeetCode (and other judges) into one profile. The audience is technical, skeptical of marketing fluff, and wants real information fast. This page must NOT look like a templated AI-generated SaaS site. Follow every spec below exactly — nothing here is a suggestion, it is a constraint.

---

## 0. HARD CONSTRAINTS — DO NOT VIOLATE

Before writing any component, internalize this forbidden list. If your output matches any of these, redo it:

- ❌ No Inter, Geist, system-ui, Poppins, or any default Tailwind/shadcn font stack
- ❌ No centered hero text block (headline + subhead + button, all centered, stacked)
- ❌ No fade-in-up scroll stagger (the `opacity:0 → 1, translateY(20px) → 0` pattern applied uniformly to every section)
- ❌ No purple-to-blue or pink-to-orange gradient backgrounds/buttons
- ❌ No `rounded-2xl` / `rounded-xl` + `shadow-lg` card treatment
- ❌ No icon-on-top-of-text card grids (Lucide/Heroicons row of 3-4 identical cards)
- ❌ No stock photography or generic 3D-blob illustrations
- ❌ No "Get Started" / "Sign Up Free" / "Unlock your potential" copy — write specific, plain-spoken copy
- ❌ No uniform 3-column equal-width grid for feature cards
- ❌ No live scroll listeners outside GSAP ScrollTrigger (no manual `window.addEventListener('scroll', ...)` doing layout math)

If you are ever unsure whether something is "the default," assume it is and pick the less obvious option specified below.

---

## 1. TECH STACK

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS (config extended with the tokens in §2 — do not use default Tailwind color/spacing/radius scales, override them)
- **Scroll orchestration (single source of truth):** GSAP + ScrollTrigger, via the `@gsap/react` `useGSAP()` hook for proper cleanup. Do not also drive scroll logic through Framer Motion — GSAP owns all scroll-linked animation to avoid two competing scroll systems.
- **Smooth scroll:** Lenis, integrated with ScrollTrigger via `ScrollTrigger.scrollerProxy` (standard Lenis+GSAP integration pattern) so pinned/scrubbed sections stay in sync with the smoothed scroll.
- **Micro-interactions only (hover/tap states on buttons/cards):** Framer Motion (`motion/react`). Scope it strictly to non-scroll-driven interactions.
- **Text splitting for headline reveals:** `split-type` (free) — split into words/chars for staggered reveals.
- **Utility:** `clsx` for conditional classNames.
- **No shadcn/ui default components.** Build every button/card/input from scratch against the tokens below.

---

## 2. DESIGN TOKENS (put these in `tailwind.config.ts` theme.extend and `globals.css :root`)

### Fonts
- **Display/headline:** `Switzer` (Fontshare, self-hosted via `next/font/local`, variable weight 300–700). Fallback stack: `'Switzer', ui-sans-serif, system-ui`.
- **Mono/data/labels:** `JetBrains Mono` via `next/font/google`. Used for every number, stat, HUD label, nav ticker, milestone tag — never for headlines or body copy.
- **Body copy:** Switzer at weight 400, larger line-height (1.6) than headline usage.
- Headline tracking: `-0.02em`. Mono label tracking: `+0.08em`, uppercase, 11–12px.
- **Mix weights within one headline** — never render a 2-line headline in a single uniform weight. e.g. line 1 at 700, line 2 at 300.

### Colors
```
--bg-base:        #0A0B0D   /* near-black, faint blue undertone — NOT pure #000 or flat #111 */
--text-primary:   #EDEAE4   /* warm off-white — never pure #FFFFFF */
--text-secondary: #8A8A85
--border-hairline:#242426   /* 1px borders only, no shadows */

--tier-newbie:      #8B8B8B
--tier-pupil:       #4CAF50
--tier-specialist:  #3DDBD9
--tier-expert:      #3B7DDB
--tier-candmaster:  #A35BE0
--tier-grandmaster: #E0473B
```
(If Arc's existing app already defines exact tier hex values elsewhere, use those instead of the above — tier color must match the rest of the product exactly.)

- No decorative gradients anywhere except the single radial tier-glow specified in §4.
- The "accent color" at any point on the page = whichever tier the background trail has currently reached. Buttons, active nav state, and card index numbers pick up this color via a CSS custom property `--active-tier` updated on scroll (see §4).

### Spacing / radius / motion
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px — no arbitrary in-between values.
- Radius scale: `0px` (default), `2px` (small elements), `4px` (cards, max). Never above 4px.
- Motion durations: `150ms` (hover states), `350ms` (card entrances), `600ms` (section-level reveals).
- Primary easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out feel) for entrances. `cubic-bezier(0.4, 0, 0.2, 1)` for hover states. Overshoot easing `back.out(1.7)` reserved only for badge/achievement unlock moments (§4, §7).
- Global grain overlay: fixed full-viewport layer, SVG turbulence or noise PNG tile, opacity `0.03`, `mix-blend-mode: overlay`, `pointer-events: none`, z-index above background but below content.
- Faint background grid: repeating horizontal hairline rules at `2–3%` opacity across the full page — literal graph-paper texture tying into the rating-graph theme.

---

## 3. GLOBAL LAYOUT PRINCIPLE

**No section may center its content block.** Every section uses an asymmetric split (roughly 45/55 or 40/60), with text anchored left and visual content (screenshots, mini-widgets, the background mountain) bleeding toward or off the right edge. Vary which side dominates section-to-section so the page doesn't feel like a repeated template, but never center-stack text+button as a standalone block.

---

## 4. GLOBAL BACKGROUND SYSTEM — mountain + light trail

This is a single fixed, full-viewport-height layer (`position: fixed; inset: 0; z-index: -1; pointer-events: none`) that sits behind the entire document and is driven by **one global scroll-progress value**, computed as:

```js
progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
```
clamped 0–1, updated inside a GSAP ScrollTrigger with `scrub: 0.5` on the `<body>` (whole-document trigger, no pinning needed here — foreground content scrolls normally on top).

### Assets provided
The user will attach two images: `mountain-base.jpg` (no trail) and `mountain-trail-reference.jpg` (a styled reference showing the trail's route/look). Use them as follows:
- `mountain-base.jpg` → the actual background photo, used **twice**, stacked:
  - **Layer A (dark/ambient):** `filter: brightness(0.5) saturate(0.65) contrast(1.05)` plus a subtle blue tint overlay (`mix-blend-mode: multiply`, low-opacity blue).
  - **Layer B (lit):** the same image, `filter: brightness(1.3) saturate(1.15) contrast(1.1)` plus a warm tint. Masked with `mask-image: radial-gradient(circle at var(--glow-x) var(--glow-y), black 0%, transparent 65%)` so it only shows through in a soft circle around the current light position. This is what makes the terrain look genuinely lit rather than having a sticker glow placed on top of it.
- `mountain-trail-reference.jpg` → **style reference only**, not used as a pixel asset. Hand-build an SVG path over `mountain-base.jpg` approximating the same route shown in that reference, and animate that path per the spec below.

### The trail path
- SVG `<path>` overlaid on the mountain, revealed via `stroke-dashoffset` tied to `progress`.
- Stroke is a `linearGradient`, full opacity/width at the current tip, fading to ~15% opacity a few hundred px behind — a comet tail, not a uniform line.
- Duplicate the path underneath, wider and blurred, at low opacity, to fake bleed of light onto the rock itself.

### The glow (three stacked layers, pre-rendered as blurred sprites, repositioned via `transform: translate()` — never live-blur a large element every frame)
1. **Core:** ~20–30px radius, 85%+ opacity, near-white/warm, tight blur.
2. **Halo:** ~120px radius, 30–40% opacity, tinted `var(--active-tier)`.
3. **Ambient spill:** ~350–400px radius, 6–10% opacity, same tint, `mix-blend-mode: screen` — this is what makes the surrounding darkness read as "lit," not just the trail itself.
- Position of all three (`--glow-x`, `--glow-y`) computed each scroll tick via `path.getPointAtLength(progress * path.getTotalLength())`.
- Subtle flicker: drive core opacity with a small sine/Perlin wobble (±3%) tied to real time (a `requestAnimationFrame` loop), not scroll — imperceptible individually, reads as real light rather than a static graphic.
- A handful (6–10) of tiny dust-mote particles near the glow position, opacity driven by proximity, slow upward drift.

### Global progress → visual state mapping
The trail stays **subtle and secondary** for most of the page — this is a background ambient layer, not the focal point, until the final section:

| Global scroll % | Background state | Rank label fires |
|---|---|---|
| 0–10% (Hero) | Trail barely visible: faint ember at base, opacity ~15%, mountain almost entirely in shadow | — |
| 10–20% (The Gap) | Trail begins a faint climb, opacity ~25% | — |
| 20–32% (Identify weaknesses) | Opacity ~35% | **1200 · Newbie** unlocks |
| 32–45% (Get personalized practice) | Opacity ~42% | **1400 · Pupil** unlocks |
| 45–58% (All your data) | Opacity ~50%, tier color shifts into cyan | **1600 · Specialist** unlocks |
| 58–72% (Track progress) | Opacity ~60% | **1800 · Expert** unlocks |
| 72–85% (Compare. Compete. Grow.) | Opacity ~70%, tier shifts to violet | **2000 · Candidate Master** unlocks |
| 85–100% (Reach new heights — payoff) | Opacity ramps to 100%, mountain composition scales/repositions to full prominence, large bloom/eclipse behind the peak | **Grandmaster** — full reveal |

Keep the trail's horizontal position confined to roughly the right third of the viewport throughout (matching the asymmetric text-left layout in §3), so it never sits directly behind dense text blocks.

### Rank label unlock animation (not a fade)
Each label starts near-invisible, desaturated, with a subtle inset "engraved" shadow. The instant `progress` crosses its threshold: run a one-time **light-sweep** (a bright diagonal highlight animated across the label via `background-position` on a gradient mask, ~400ms) while opacity/saturation snap to full, paired with a small scale pulse (`1 → 1.04 → 1`, `back.out(1.7)`, ~250ms) and 4–6 small particles drifting outward and fading. This should read as a game-style achievement unlock, not a website scroll-reveal.

---

## 5. PAGE SECTIONS

Each section below: layout, copy direction, and animation. All entrance animations use GSAP ScrollTrigger with `toggleActions: "play none none reverse"` (triggered once in view, not scrubbed, unless noted).

### 5.1 — Nav (sticky, `position: sticky; top: 0`)
- Logo "ARC" top-left, mono font, tracked wide.
- 2–3 text links + one CTA button, top-right. Button: sharp/2px corners, 1px border, no fill until hover (hover fills with `--active-tier`).
- A small live mono ticker inline in the nav bar itself (e.g. `1,204,391 submissions tracked` — rotates/increments) — establishes "this is live software" immediately.
- Background: transparent until scrolled past 40px, then `backdrop-filter: blur(12px)` + `--bg-base` at 80% opacity.

### 5.2 — Hero (direct, information-forward — NOT mountain-dominant)
Split 45/55, left text / right product proof:
- **Left:** micro-label in mono caps (`// ONE RATING. EVERY JUDGE.`) → two-line headline, mixed weight (e.g. line 1 bold: "Every problem you solve", line 2 light, muted color: "takes you somewhere.") → one-sentence subhead stating the fragmented-CF/LeetCode-identity problem → CTA button "Connect your handle" with a blinking mono cursor glyph after the text (not an arrow icon) → the live mono ticker can also sit here instead of/in addition to the nav.
- **Right:** a hollow placeholder frame (1px hairline border, 4px radius max, faint corner brackets like a viewfinder) sized for a **real product screenshot** of the actual Arc dashboard. Label the placeholder clearly in a code comment: `{/* SCREENSHOT: Arc dashboard overview — replace with real product image */}`. This placeholder should have a very subtle idle animation (a slow, barely-perceptible parallax tilt on mouse move, ±2deg max) so it doesn't feel static even before the real image is dropped in.
- Headline text splits into words via `split-type` and staggers in (each word offset 40ms, `cubic-bezier(0.16,1,0.3,1)`, 600ms) on page load, not on scroll.
- Background mountain here is at its dimmest (per §4 table) — present as mood/atmosphere only, not a focal element.

### 5.3 — "The Gap" (text-led, tight measure, no big visual)
- Single column, max-width ~640px, left-anchored (not centered on the page — sits within the left 55% of the viewport).
- Copy: names the fragmented-identity problem directly (CF rating and LeetCode rating that never talk to each other).
- A small hollow placeholder for a minimal two-value comparison graphic (e.g. two mono numbers side by side with a "≠" between them) — label it `{/* MINI GRAPHIC: two disconnected ratings */}`.
- Animation: text lines reveal via clip-path wipe (not opacity fade) — `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)`, 500ms, staggered per line.

### 5.4 — Card cluster A: "Identify weaknesses" (index `01`)
- Off-grid: card offset to the left third, NOT full-width, NOT grid-aligned with the next cluster.
- Card: 1px hairline border, 2px radius, oversized mono index number `01` in the corner (not an icon).
- Inside: real content, not an icon — a hollow placeholder for a miniature "weakest topic" widget (a small radial/bar showing e.g. "Graphs · 41%"). Label: `{/* MINI WIDGET: weakest topic bar */}`.
- Entrance: card slides in from a slight diagonal offset (`x: -24px, y: 16px → 0,0`) with a slight rotation settle (`rotate: -1.5deg → 0deg`), 350ms — avoids the generic straight fade-up.

### 5.5 — Card cluster B: "Get personalized practice" (index `02`)
- Off-grid: offset to the right two-thirds this time (deliberately not aligned under cluster A) — different vertical offset too, so the two clusters don't form an implicit grid.
- Hollow placeholder for a "Today's Mission" checklist mini-widget. Label: `{/* MINI WIDGET: today's mission checklist */}`.
- Entrance: same diagonal-settle pattern as 5.4 but mirrored (`x: +24px`, `rotate: +1.5deg → 0`).

### 5.6 — Proof section: "All your data. Finally makes sense."
- Larger hollow placeholder (this is the biggest screenshot on the page), framed with the same viewfinder-corner treatment as the hero. Label: `{/* SCREENSHOT: full dashboard — sidebar nav, stat cards, rating graph, topic radar */}`.
- Text sits to the left, ~40% width; screenshot placeholder bleeds to the right edge of the viewport (not contained/padded on the right side).
- Entrance: screenshot placeholder scales in from 0.96 → 1 with a simultaneous mask-reveal (clip-path wipe left-to-right), 600ms, `cubic-bezier(0.16,1,0.3,1)`.

### 5.7 — Card cluster C: "Track progress. See improvement." (index `03`)
- Hollow placeholder for a small rating-line-graph mini-widget (mono label `+38` next to it). Label: `{/* MINI WIDGET: rating change graph */}`.
- Off-grid position distinct from clusters A/B (e.g., centered-left but larger card width than the others — vary size, not just position).
- Entrance: same diagonal-settle family, direction varied again.

### 5.8 — Card cluster D: "Compare. Compete. Grow." (index `04`)
- Hollow placeholder for a small friends-leaderboard mini-widget (a few rows: name, rating, delta arrow). Label: `{/* MINI WIDGET: friends leaderboard */}`.
- This card can be visually the largest of the four clusters — it's the strongest differentiator (head-to-head/social layer), give it more visual weight.
- Optional stretch detail: a thin leader-line from this card's corner toward the background trail's current glow position, tying the foreground content back to the ambient background system.

### 5.9 — Payoff: "Reach new heights" (final section before footer)
This is where the background system graduates from ambient to focal, per the §4 table:
- Mountain composition scales up / repositions to fill significantly more of the viewport; trail opacity ramps to 100%.
- A large soft glow ("eclipse") appears behind the peak as the trail reaches its end — three-layer bloom per §4, but scaled up (core ~40px, halo ~220px, ambient ~600px).
- "Grandmaster" label appears large, using the same light-sweep engrave animation as other rank labels but at 2–3x the scale and duration (~700ms).
- Final CTA repeats here ("Connect your handle"), sitting beneath/beside the reveal, fading in after the glow settles (~300ms delay).
- This section may use a light `ScrollTrigger` pin (short pin, ~100vh) so the eclipse-reveal has a moment to breathe rather than flashing past.

### 5.10 — Footer
- Minimal: logo, 2–3 links, mono-styled copyright line. No large closing banner — the payoff section above already served that purpose. Keep this quiet by contrast.

---

## 6. MICRO-INTERACTIONS (Framer Motion, scoped only to these)

- **Custom cursor:** small dot + trailing ring (`mix-blend-mode: difference` or similar), ring color = `var(--active-tier)`. Hide on touch devices.
- **Magnetic buttons:** primary CTA(s) pull a few px toward the cursor within a ~40px radius, spring back on leave (`type: "spring", stiffness: 300, damping: 20`).
- **Card hover:** border color transitions from `--border-hairline` to `--active-tier` over 150ms; no shadow, no scale-up beyond 1.01.

---

## 7. ACCESSIBILITY & PERFORMANCE

- Respect `prefers-reduced-motion: reduce`: disable the flicker loop, parallax tilt, and magnetic buttons; collapse scroll-scrubbed entrances to simple fast fades (150ms); keep the background trail static at its final lit state instead of animating.
- Use `next/image` for all real screenshots once dropped in (lazy-load below-the-fold).
- Do not run the glow/mask position update on every raw scroll event — drive it through the single ScrollTrigger `onUpdate` callback with `scrub`, and use CSS custom properties + `transform`/`mask-position` rather than re-rendering React state on every frame.
- On viewports < 768px: disable the pinned payoff section (let it scroll normally), simplify the background to a single static gradient line (no live mask/glow compositing), stack all cards full-width in document order.
- Clean up every GSAP ScrollTrigger instance via `useGSAP()`'s automatic context cleanup (or manual `.kill()` in a `useEffect` return) — no leaked triggers on route change.

---

## 8. CODE QUALITY

- TypeScript strict mode. Typed props for every component, no `any`.
- One component per section (`Hero.tsx`, `TheGap.tsx`, `CardClusterA.tsx`, etc.) inside a `components/landing/` folder — no single monolithic page file.
- The background system (`MountainTrail.tsx`) is its own isolated component owning all scroll-progress logic; sections read `--active-tier` and rank-unlock state via CSS custom properties / a small shared context, not by duplicating scroll logic per section.
- Extract the design tokens (§2) into `tailwind.config.ts` and a `tokens.ts` file — no magic hex/px values inline in components.
- Comment every screenshot/widget placeholder clearly (as shown in §5) so real assets can be swapped in without hunting through the code.
