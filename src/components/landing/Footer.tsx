import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t py-12" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
      <div className="mx-auto max-w-5xl px-4 flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl font-bold tracking-tight" style={{ color: 'var(--accent-primary)' }}>arc</span>
        </div>
        
        <nav className="flex gap-6 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          <Link href="/login" className="transition-colors hover:text-white">Sign In</Link>
          <Link href="/signup" className="transition-colors hover:text-white">Sign Up</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">GitHub</a>
        </nav>

        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          © {new Date().getFullYear()} Arc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
