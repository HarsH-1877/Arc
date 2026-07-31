'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Payoff() {
  const sectionRef = useRef<HTMLElement>(null);
  const gmLabelRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.set([gmLabelRef.current, ctaRef.current], { opacity: 0, y: 24 });

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      toggleActions: 'play none none reverse',
      onEnter() {
        // GM label — light-sweep style
        gsap.to(gmLabelRef.current, {
          opacity: 1, y: 0,
          duration: 0.7,
          ease: 'cubic-bezier(0.16,1,0.3,1)',
          delay: 0.3,
          onComplete() {
            if (gmLabelRef.current) {
              gmLabelRef.current.classList.add('label-sweep');
              setTimeout(() => gmLabelRef.current?.classList.remove('label-sweep'), 700);
            }
          },
        });
        // CTA delayed
        gsap.to(ctaRef.current, {
          opacity: 1, y: 0,
          duration: 0.4,
          ease: 'cubic-bezier(0.16,1,0.3,1)',
          delay: 0.6,
        });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="payoff"
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '128px 0',
      }}
    >

      <div className="relative mx-auto w-full max-w-[1400px] px-8 lg:px-12">
        <div style={{ maxWidth: 520, paddingLeft: '2%' }}>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] block mb-8" style={{ color: '#8A8A85' }}>
            {'// REACH NEW HEIGHTS'}
          </span>

          {/* Grandmaster label — large, light-sweep on trigger */}
          <div ref={gmLabelRef} className="mb-12">
            <span
              className="font-mono font-bold uppercase"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.4rem)',
                letterSpacing: '0.18em',
                color: '#E0473B',
                display: 'block',
                marginBottom: 4,
              }}
            >
              2300+ · Grandmaster
            </span>
            <div style={{ width: 48, height: 2, background: '#E0473B', marginBottom: 24, borderRadius: 1 }} />

            <h2
              style={{
                fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#EDEAE4',
                lineHeight: 1.05,
              }}
            >
              The peak is the goal.
              <span
                style={{
                  display: 'block',
                  fontWeight: 300,
                  color: '#8A8A85',
                  marginTop: 8,
                }}
              >
                Arc keeps you moving toward it.
              </span>
            </h2>
          </div>

          <div ref={ctaRef}>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#8A8A85', marginBottom: 32, maxWidth: 440 }}>
              Stop switching between two dashboards and losing the thread. Connect your handles and see
              the full picture in under a minute.
            </p>

            <Link
              href="/signup?fresh=1"
              className="landing-connect-link relative z-20 inline-flex items-center gap-3 border px-8 py-4 font-mono text-[13px] uppercase tracking-[0.1em]"
              style={{
                borderColor: 'var(--active-tier, #3B7DDB)',
                borderRadius: 2,
                color: '#EDEAE4',
                transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              Connect your handle
              <span style={{ color: 'var(--active-tier, #3B7DDB)', animation: 'blink 1s step-end infinite' }}>_</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
