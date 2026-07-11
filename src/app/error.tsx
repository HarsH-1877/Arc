'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/shared/GlassCard';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <GlassCard padding="lg" className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--color-danger-dim)', color: 'var(--color-danger)' }}>
          <AlertTriangle size={32} />
        </div>
        <h2 className="mb-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Something went wrong!</h2>
        <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
          We encountered an unexpected error while processing your request.
        </p>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="flex h-10 items-center justify-center rounded-lg px-6 text-sm font-medium transition-colors hover:opacity-90"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="flex h-10 items-center justify-center rounded-lg px-6 text-sm font-medium transition-colors hover:bg-white/[0.05]"
            style={{ color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
          >
            Go back home
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
