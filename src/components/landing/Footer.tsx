'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '48px 0 64px',
        borderTop: '1px solid #242426',
      }}
    >
      <div className="mx-auto max-w-7xl px-8 lg:px-16">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/">
            <img
              src="/logo.png"
              alt="ARC Logo"
              style={{ height: 42, width: 'auto', objectFit: 'contain' }}
            />
          </Link>

          {/* Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/privacy"
              className="font-mono text-[10px] uppercase tracking-[0.08em] transition-opacity hover:opacity-100"
              style={{ color: '#8A8A85' }}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-mono text-[10px] uppercase tracking-[0.08em] transition-opacity hover:opacity-100"
              style={{ color: '#8A8A85' }}
            >
              Terms
            </Link>
            <Link
              href="https://github.com"
              className="font-mono text-[10px] uppercase tracking-[0.08em] transition-opacity hover:opacity-100"
              style={{ color: '#8A8A85' }}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Link>
          </div>

          {/* Copyright */}
          <span
            className="font-mono text-[10px] uppercase tracking-[0.08em]"
            style={{ color: '#8A8A85' }}
          >
            © {new Date().getFullYear()} Arc
          </span>
        </div>
      </div>
    </footer>
  );
}
