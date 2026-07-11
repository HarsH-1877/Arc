'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Trophy,
  Code2,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useDebounce } from '@/hooks/useDebounce';

// ─── Step progress indicator ─────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-3">
      {Array.from({ length: total }, (_, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'upcoming';
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className="h-2 w-2 rounded-full transition-all duration-300"
              style={{
                background:
                  state === 'done'
                    ? 'var(--accent-green)'
                    : state === 'active'
                      ? 'var(--accent-primary)'
                      : 'var(--border-default)',
                transform: state === 'active' ? 'scale(1.4)' : 'scale(1)',
              }}
            />
            {i < total - 1 && (
              <div
                className="h-px w-8 transition-all duration-300"
                style={{ background: i < current ? 'var(--accent-green)' : 'var(--border-subtle)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CF preview card ─────────────────────────────────────────────────────────

interface CFUser {
  handle: string;
  rating: number | null;
  rank: string | null;
  avatar: string | null;
}

interface LCUser {
  username: string;
  totalSolved: number;
  ranking: number | null;
  avatar: string | null;
}

function CFPreviewCard({ user }: { user: CFUser }) {
  return (
    <div
      className="mt-3 flex items-center gap-3 rounded-lg p-3"
      style={{ background: 'var(--accent-primary-dim)', border: '1px solid var(--accent-primary-glow)' }}
    >
      {user.avatar && (
        <Image src={user.avatar} alt={user.handle} width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {user.handle}
        </p>
        {user.rank && (
          <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
            {user.rank} {user.rating ? `· ${user.rating}` : ''}
          </p>
        )}
      </div>
      <CheckCircle2 size={18} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
    </div>
  );
}

function LCPreviewCard({ user }: { user: LCUser }) {
  return (
    <div
      className="mt-3 flex items-center gap-3 rounded-lg p-3"
      style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(6,182,212,0.3)' }}
    >
      {user.avatar && (
        <Image src={user.avatar} alt={user.username} width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {user.username}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {user.totalSolved} problems solved
          {user.ranking ? ` · Rank #${user.ranking.toLocaleString()}` : ''}
        </p>
      </div>
      <CheckCircle2 size={18} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
    </div>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

const transition = { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const };

// ─── Main onboarding component ────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 0 — profile
  const [displayName, setDisplayName] = useState('');

  // Step 1 — Codeforces
  const [cfHandle, setCfHandle] = useState('');
  const [cfStatus, setCfStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [cfUser, setCfUser] = useState<CFUser | null>(null);
  const [cfError, setCfError] = useState('');
  const debouncedCfHandle = useDebounce(cfHandle, 600);

  // Step 2 — LeetCode
  const [lcUsername, setLcUsername] = useState('');
  const [lcStatus, setLcStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [lcUser, setLcUser] = useState<LCUser | null>(null);
  const [lcError, setLcError] = useState('');
  const debouncedLcUsername = useDebounce(lcUsername, 600);

  const [completing, setCompleting] = useState(false);

  // ── CF validation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedCfHandle) { setCfStatus('idle'); setCfUser(null); setCfError(''); return; }
    setCfStatus('checking');
    setCfUser(null);
    fetch(`/api/onboarding/validate-cf?handle=${encodeURIComponent(debouncedCfHandle)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setCfStatus('valid');
          setCfUser(data.user);
          setCfError('');
        } else {
          setCfStatus('invalid');
          setCfError(data.error ?? 'Handle not found.');
        }
      })
      .catch(() => { setCfStatus('invalid'); setCfError('Could not reach Codeforces.'); });
  }, [debouncedCfHandle]);

  // ── LC validation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedLcUsername) { setLcStatus('idle'); setLcUser(null); setLcError(''); return; }
    setLcStatus('checking');
    setLcUser(null);
    fetch(`/api/onboarding/validate-lc?username=${encodeURIComponent(debouncedLcUsername)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setLcStatus('valid');
          setLcUser(data.user);
          setLcError('');
        } else {
          setLcStatus('invalid');
          setLcError(data.error ?? 'Username not found.');
        }
      })
      .catch(() => { setLcStatus('invalid'); setLcError('Could not reach LeetCode.'); });
  }, [debouncedLcUsername]);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => s + 1);
  }, []);

  const complete = async () => {
    setCompleting(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName || undefined,
          cfHandle: cfStatus === 'valid' ? cfHandle : undefined,
          lcUsername: lcStatus === 'valid' ? lcUsername : undefined,
        }),
      });
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    }
  };

  return (
    <div>
      <StepDots current={step} total={3} />

      <GlassCard padding="lg" className="w-full overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ── Step 0: Profile ─────────────────────────────────────── */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <div className="mb-6">
                <p className="mb-1 font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                  Step 1 of 3
                </p>
                <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                  Let&apos;s set up your Arc profile
                </h2>
                <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  You can always update this later in settings.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="display-name" className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Display name <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    maxLength={50}
                    className="h-11 w-full rounded-lg border px-3 text-sm outline-none transition-colors"
                    style={{ background: 'var(--bg-surface-3)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(124,58,237,0.6)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
                  />
                </div>
              </div>

              <button
                onClick={goNext}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-md)' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ── Step 1: Codeforces ──────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <div className="mb-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--accent-primary-dim)' }}>
                  <Trophy size={20} style={{ color: 'var(--accent-primary-light)' }} />
                </div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                  Step 2 of 3
                </p>
                <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                  Your Codeforces handle
                </h2>
                <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  We only read public data. We never need your password.
                </p>
              </div>

              <div>
                <label htmlFor="cf-handle" className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Codeforces handle
                </label>
                <div className="relative">
                  <input
                    id="cf-handle"
                    type="text"
                    value={cfHandle}
                    onChange={(e) => setCfHandle(e.target.value.trim())}
                    placeholder="tourist"
                    className="h-11 w-full rounded-lg border px-3 pr-10 font-mono text-sm outline-none transition-colors"
                    style={{ background: 'var(--bg-surface-3)', borderColor: cfStatus === 'valid' ? 'rgba(16,185,129,0.5)' : cfStatus === 'invalid' ? 'rgba(239,68,68,0.5)' : 'var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cfStatus === 'checking' && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />}
                    {cfStatus === 'valid' && <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />}
                    {cfStatus === 'invalid' && <XCircle size={14} style={{ color: 'var(--color-danger)' }} />}
                  </span>
                </div>
                {cfStatus === 'invalid' && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>{cfError}</p>
                )}
                {cfStatus === 'valid' && cfUser && <CFPreviewCard user={cfUser} />}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={goNext}
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Skip for now
                </button>
                <button
                  onClick={goNext}
                  disabled={cfHandle.length > 0 && cfStatus !== 'valid'}
                  className="flex flex-1 h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-md)' }}
                >
                  {cfStatus === 'checking' ? <Loader2 size={16} className="animate-spin" /> : <>Next <ChevronRight size={16} /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: LeetCode ────────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <div className="mb-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--accent-cyan-dim)' }}>
                  <Code2 size={20} style={{ color: 'var(--accent-cyan)' }} />
                </div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--accent-cyan)' }}>
                  Step 3 of 3
                </p>
                <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                  Your LeetCode username
                </h2>
                <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  We only read public data. We never need your password.
                </p>
              </div>

              <div>
                <label htmlFor="lc-username" className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  LeetCode username
                </label>
                <div className="relative">
                  <input
                    id="lc-username"
                    type="text"
                    value={lcUsername}
                    onChange={(e) => setLcUsername(e.target.value.trim())}
                    placeholder="neal_wu"
                    className="h-11 w-full rounded-lg border px-3 pr-10 font-mono text-sm outline-none transition-colors"
                    style={{ background: 'var(--bg-surface-3)', borderColor: lcStatus === 'valid' ? 'rgba(16,185,129,0.5)' : lcStatus === 'invalid' ? 'rgba(239,68,68,0.5)' : 'var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {lcStatus === 'checking' && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />}
                    {lcStatus === 'valid' && <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />}
                    {lcStatus === 'invalid' && <XCircle size={14} style={{ color: 'var(--color-danger)' }} />}
                  </span>
                </div>
                {lcStatus === 'invalid' && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>{lcError}</p>
                )}
                {lcStatus === 'valid' && lcUser && <LCPreviewCard user={lcUser} />}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={complete}
                  disabled={completing}
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Skip for now
                </button>
                <button
                  onClick={complete}
                  disabled={completing || (lcUsername.length > 0 && lcStatus !== 'valid')}
                  className="flex flex-1 h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-md)' }}
                >
                  {completing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <>Go to dashboard <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
