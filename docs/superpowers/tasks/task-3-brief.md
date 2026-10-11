# Task 3 Brief: Landing Page Guest Mode Buttons

## Goal
Add a dedicated "Guest Mode" button in the landing page navigation between "Sign in" and "Connect handle", and add a secondary "Explore in Guest Mode →" link in the Hero section.

## Files to Modify

### 1. `src/components/landing/LandingNav.tsx`
In `src/components/landing/LandingNav.tsx` (around lines 96-121):
Between the `Sign in` link and the `Connect handle` link, insert the Guest Mode button linking to `/api/auth/guest`:
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
          className="landing-connect-link inline-flex h-9 items-center justify-center border px-4 font-mono text-[11px] uppercase leading-none tracking-[0.08em] transition-all duration-150"
          style={{
            borderColor: '#242426',
            borderRadius: 2,
            color: '#EDEAE4',
            transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          Connect handle
          <span className="ml-1 animate-pulse" style={{ color: 'var(--active-tier, #3B7DDB)' }}>
            _
          </span>
        </Link>
```

### 2. `src/components/landing/Hero.tsx`
In `src/components/landing/Hero.tsx` (around lines 98-118):
Wrap the primary CTA and add a secondary guest exploration link:
```tsx
            {/* CTA buttons */}
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
                Explore in Guest Mode →
              </Link>
            </div>
```

## Testing & Verification
1. Run `npm run build` to verify 0 errors.
2. Commit: `feat: add guest mode buttons to landing navbar and hero`.
3. Write report to `docs/superpowers/tasks/task-3-report.md`.
