'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const TICKER_ITEMS = [
  '1,204,391 submissions tracked',
  '38,204 problems solved today',
  '12,847 active users',
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const btnRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTickerIdx((i) => (i + 1) % TICKER_ITEMS.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Magnetic effect on CTA
  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 48) {
      btn.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px)`;
    }
  }
  function handleMouseLeave() {
    if (btnRef.current) btnRef.current.style.transform = '';
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300"
      style={{
        backdropFilter: 'blur(14px)',
        background: scrolled ? 'rgba(10,11,13,0.88)' : 'rgba(10,11,13,0.74)',
        borderBottom: scrolled ? '1px solid #242426' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <Link href="/">
        <img
          src="/logo.png"
          alt="ARC Logo"
          style={{ height: 56, width: 'auto', objectFit: 'contain' }}
        />
      </Link>

      {/* Center ticker */}
      <div
        className="hidden items-center gap-2 md:flex"
        style={{ color: '#8A8A85' }}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: '#8A8A85' }}>
          ↗
        </span>
        <span
          key={tickerIdx}
          className="font-mono text-[11px] uppercase tracking-[0.08em]"
          style={{ color: '#8A8A85', animation: 'fadeIn 0.35s ease' }}
        >
          {TICKER_ITEMS[tickerIdx]}
        </span>
      </div>

      {/* Right links + CTA */}
      <div className="flex items-center gap-5">
        <Link
          href="#features"
          className="landing-feature-link inline-flex h-9 items-center font-mono text-[11px] uppercase tracking-[0.08em]"
          style={{ color: '#8A8A85' }}
        >
          Features
        </Link>
        <Link
          href="/login?fresh=1"
          className="landing-feature-link inline-flex h-9 items-center font-mono text-[11px] uppercase tracking-[0.08em]"
          style={{ color: '#8A8A85' }}
        >
          Sign in
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
      </div>
    </nav>
  );
}
