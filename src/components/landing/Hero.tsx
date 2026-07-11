'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { NodeBackground } from '@/components/shared/NodeBackground';
import { ArrowRight } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import gsap from 'gsap';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const btnsRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });

    tl.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, 0.2)
      .fromTo(textRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, 0.4)
      .fromTo(btnsRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, 0.6)
      .fromTo(imgRef.current, { y: 60, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1 }, 0.8);

    return () => { tl.kill(); };
  }, [reducedMotion]);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 z-0">
        <NodeBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-base)]/50 to-[var(--bg-base)]" />
      </div>

      <div ref={containerRef} className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-8" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <span className="flex h-2 w-2 rounded-full" style={{ background: 'var(--accent-primary)' }} />
          Public Beta Available
        </div>

        <h1 ref={titleRef} className="text-5xl font-semibold tracking-tight sm:text-7xl mb-6" style={{ color: 'var(--text-primary)' }}>
          Your coding journey,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-cyan)]">
            unified.
          </span>
        </h1>

        <p ref={textRef} className="mx-auto max-w-2xl text-lg sm:text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>
          A premium analytics and social hub for competitive programmers. Connect Codeforces and LeetCode, track your consistency, and compare head-to-head with friends.
        </p>

        <div ref={btnsRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-8 text-sm font-medium transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
          >
            Start your journey <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="flex h-12 w-full sm:w-auto items-center justify-center rounded-lg px-8 text-sm font-medium transition-colors hover:bg-white/[0.05]"
            style={{ color: 'var(--text-primary)' }}
          >
            Sign in
          </Link>
        </div>

        <div ref={imgRef} className="mt-20 mx-auto w-full max-w-4xl relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-cyan)] opacity-20 blur-3xl" />
          <div className="relative rounded-2xl border bg-black overflow-hidden" style={{ borderColor: 'var(--border-subtle)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            {/* Minimal mockup of dashboard */}
            <div className="flex items-center gap-1.5 border-b px-4 py-3" style={{ background: 'var(--bg-surface-1)', borderColor: 'var(--border-subtle)' }}>
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="aspect-video w-full bg-[var(--bg-base)] p-4 flex gap-4">
              <div className="w-48 h-full rounded-lg" style={{ background: 'var(--bg-surface-2)' }} />
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="h-24 flex-1 rounded-lg" style={{ background: 'var(--bg-surface-2)' }} />
                  <div className="h-24 flex-1 rounded-lg" style={{ background: 'var(--bg-surface-2)' }} />
                  <div className="h-24 flex-1 rounded-lg" style={{ background: 'var(--bg-surface-2)' }} />
                </div>
                <div className="flex-1 rounded-lg" style={{ background: 'var(--bg-surface-2)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
