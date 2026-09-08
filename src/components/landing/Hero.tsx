'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // Word-stagger headline reveal on load
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = [headlineRef.current, subRef.current, ctaRef.current].filter(Boolean);
    if (prefersReduced) {
      gsap.set(els, { opacity: 1 });
      return;
    }
    gsap.set(els, { opacity: 0, y: 18 });
    gsap.to(els, {
      opacity: 1,
      y: 0,
      stagger: 0.12,
      duration: 0.6,
      ease: 'cubic-bezier(0.16,1,0.3,1)',
      delay: 0.1,
    });
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center"
      style={{ paddingTop: 80 }}
    >
      {/* Background grid — faint horizontal hairlines */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-8 lg:px-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[45fr_55fr] lg:gap-8">
          {/* Left — text */}
          <div className="flex flex-col justify-center py-16 lg:py-0">
            {/* Micro-label */}
            <span
              className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--active-tier, #3B7DDB)' }}
            >
              {'// COMPETITIVE PROGRAMMING. CONNECTED.'}
            </span>

            {/* Two-line headline, mixed weight */}
            <h1
              ref={headlineRef}
              className="mb-6"
              style={{
                fontSize: 'clamp(2.8rem, 5vw, 4.2rem)',
                lineHeight: 1.06,
                letterSpacing: '-0.02em',
                color: '#EDEAE4',
              }}
            >
              <span style={{ fontWeight: 700, display: 'block' }}>Every Platform Every Peer</span>
              <span style={{ fontWeight: 300, display: 'block', color: '#8A8A85' }}>
                One Place.
              </span>
            </h1>

            {/* Sub-headline */}
            <p
              ref={subRef}
              className="mb-10 max-w-md"
              style={{
                fontSize: '1rem',
                lineHeight: 1.6,
                color: '#8A8A85',
                fontWeight: 400,
              }}
            >
             All CP platforms, unified in one dashboard. Add your friends, no more typing profile URLs on each platform. 
             Get a detailed 1v1 breakdown: ratings, topics, contests, streaks, across every platform at once. 
             Weakness tracking, contest calendar and more useful CP tools.
            </p>

            {/* CTA */}
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

            {/* Live stat */}
            <p
              className="mt-8 font-mono text-[10px] uppercase tracking-[0.08em]"
              style={{ color: '#8A8A85' }}
            >
              ↗ 38,204 problems solved in the last 24 h
            </p>
          </div>

          {/* Right — screenshot placeholder */}
          <div className="flex items-center justify-end">
            <div
              className="relative w-full max-w-2xl"
              style={{
                transform: 'none',
              }}
            >
              {/* Viewfinder corner brackets */}
              <div
                style={{
                  position: 'relative',
                  border: '1px solid #242426',
                  borderRadius: 4,
                  aspectRatio: '16/10',
                  background: 'rgba(10,11,13,0.6)',
                  overflow: 'hidden',
                }}
              >
                {/* Corner brackets */}
                {[
                  { top: 8, left: 8, borderTop: '1px solid', borderLeft: '1px solid', borderTopLeftRadius: 2 },
                  { top: 8, right: 8, borderTop: '1px solid', borderRight: '1px solid', borderTopRightRadius: 2 },
                  { bottom: 8, left: 8, borderBottom: '1px solid', borderLeft: '1px solid', borderBottomLeftRadius: 2 },
                  { bottom: 8, right: 8, borderBottom: '1px solid', borderRight: '1px solid', borderBottomRightRadius: 2 },
                ].map((style, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: 16,
                      height: 16,
                      borderColor: 'var(--active-tier, #3B7DDB)',
                      ...style,
                    }}
                  />
                ))}

                {/* Placeholder label */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.1em] text-center px-8"
                    style={{ color: '#242426' }}
                  >
                    {/* SCREENSHOT: Arc dashboard overview — replace with real product image */}
                  DASHBOARD SCREENSHOT
                  </span>
                </div>

                {/* Faint scan-line texture */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
