import Link from 'next/link';
import { GlassCard } from '@/components/shared/GlassCard';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <GlassCard padding="lg" className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}>
          <FileQuestion size={32} />
        </div>
        <h2 className="mb-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Page Not Found</h2>
        <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
          We couldn&apos;t find the page you were looking for. It might have been moved or deleted.
        </p>
        
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg px-6 text-sm font-medium transition-colors hover:opacity-90"
          style={{ background: 'var(--accent-primary)', color: '#fff' }}
        >
          Return Home
        </Link>
      </GlassCard>
    </div>
  );
}
