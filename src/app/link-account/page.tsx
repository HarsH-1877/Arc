'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Code2, Loader2, Trophy, XCircle } from 'lucide-react';
import { AuthStepper } from '@/components/auth/AuthStepper';
import { useDebounce } from '@/hooks/useDebounce';
import { EASE_OUT_FAST } from '@/lib/animations';

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

export default function LinkAccountPage() {
  const router = useRouter();
  const [cfHandle, setCfHandle] = useState('');
  const [lcUsername, setLcUsername] = useState('');
  const [cfStatus, setCfStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [lcStatus, setLcStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [cfUser, setCfUser] = useState<CFUser | null>(null);
  const [lcUser, setLcUser] = useState<LCUser | null>(null);
  const [cfError, setCfError] = useState('');
  const [lcError, setLcError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const debouncedCfHandle = useDebounce(cfHandle, 300);
  const debouncedLcUsername = useDebounce(lcUsername, 300);

  useEffect(() => {
    if (!debouncedCfHandle) {
      setCfStatus('idle');
      setCfUser(null);
      setCfError('');
      return;
    }

    const controller = new AbortController();
    setCfStatus('checking');
    fetch(`/api/onboarding/validate-cf?handle=${encodeURIComponent(debouncedCfHandle)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data.valid) {
          setCfStatus('valid');
          setCfUser(data.user);
          setCfError('');
        } else {
          setCfStatus('invalid');
          setCfUser(null);
          setCfError(data.error ?? 'Handle not found.');
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === 'AbortError') return;
        setCfStatus('invalid');
        setCfError('Could not reach Codeforces.');
      });

    return () => controller.abort();
  }, [debouncedCfHandle]);

  useEffect(() => {
    if (!debouncedLcUsername) {
      setLcStatus('idle');
      setLcUser(null);
      setLcError('');
      return;
    }

    const controller = new AbortController();
    setLcStatus('checking');
    fetch(`/api/onboarding/validate-lc?username=${encodeURIComponent(debouncedLcUsername)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data.valid) {
          setLcStatus('valid');
          setLcUser(data.user);
          setLcError('');
        } else {
          setLcStatus('invalid');
          setLcUser(null);
          setLcError(data.error ?? 'Username not found.');
        }
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === 'AbortError') return;
        setLcStatus('invalid');
        setLcError('Could not reach LeetCode.');
      });

    return () => controller.abort();
  }, [debouncedLcUsername]);

  const canSave =
    !saving &&
    ((cfHandle.length === 0 || cfStatus === 'valid') && (lcUsername.length === 0 || lcStatus === 'valid')) &&
    (cfStatus === 'valid' || lcStatus === 'valid');

  const complete = async () => {
    if (!canSave) return;
    setSubmitError('');
    setSaving(true);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cfHandle: cfStatus === 'valid' ? cfHandle : undefined,
          lcUsername: lcStatus === 'valid' ? lcUsername : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'Could not finish linking your accounts.');
      router.push('/dashboard');
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Could not finish linking your accounts.');
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    setSubmitError('');
    setSaving(true);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'Could not complete setup.');
      router.push('/dashboard');
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Could not complete setup.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-page)] p-4 md:h-dvh md:min-h-0 md:p-6">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_70%_-10%,rgba(79,110,247,0.12),transparent_70%)]" />
      <motion.div className="relative z-10 w-full max-w-3xl" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={EASE_OUT_FAST}>
        <AuthStepper current={2} />
        <section className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[rgba(17,17,20,0.94)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="grid border-b border-[var(--border-subtle)] px-7 py-5 text-center md:grid-cols-[1fr_auto] md:items-center md:text-left">
            <div>
              <Image src="/logo.png" width={44} height={44} alt="Arc" className="mx-auto h-11 w-11 object-contain md:mx-0" priority />
              <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Connect your handles</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                Arc reads public Codeforces and LeetCode data, syncs your history, and builds your dashboard from it.
              </p>
            </div>
            <span className="mt-4 rounded-full border border-[rgba(79,110,247,0.28)] bg-[rgba(79,110,247,0.1)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent-blue)] md:mt-0">
              Step 3 of 3
            </span>
          </div>

          <div className="grid gap-4 p-7 md:grid-cols-2">
            <HandleCard
              label="Codeforces"
              icon={<Trophy size={18} />}
              logo="/cf-logo.webp"
              value={cfHandle}
              placeholder="tourist"
              status={cfStatus}
              error={cfError}
              onChange={setCfHandle}
            >
              {cfUser && (
                <PreviewRow image={cfUser.avatar} name={cfUser.handle} meta={[cfUser.rank, cfUser.rating ? String(cfUser.rating) : null].filter(Boolean).join(' · ')} />
              )}
            </HandleCard>

            <HandleCard
              label="LeetCode"
              icon={<Code2 size={18} />}
              logo="/lc-logo.png"
              value={lcUsername}
              placeholder="neal_wu"
              status={lcStatus}
              error={lcError}
              onChange={setLcUsername}
            >
              {lcUser && (
                <PreviewRow
                  image={lcUser.avatar}
                  name={lcUser.username}
                  meta={`${lcUser.totalSolved} solved${lcUser.ranking ? ` · Rank #${lcUser.ranking.toLocaleString()}` : ''}`}
                />
              )}
            </HandleCard>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-7 py-5">
            <button type="button" onClick={skip} disabled={saving} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50">
              Skip for now
            </button>
            <button
              type="button"
              onClick={complete}
              disabled={!canSave}
              className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent-blue)] px-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(79,110,247,0.24)] hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <>Finish setup <ArrowRight size={15} className="group-hover:translate-x-0.5" /></>}
            </button>
          </div>
          {submitError && <p className="border-t border-[rgba(240,85,79,0.2)] px-7 py-3 text-sm text-[var(--color-danger)]">{submitError}</p>}
        </section>
      </motion.div>
    </main>
  );
}

function HandleCard({
  label,
  icon,
  logo,
  value,
  placeholder,
  status,
  error,
  children,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  logo: string;
  value: string;
  placeholder: string;
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  error: string;
  children: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src={logo} width={28} height={28} alt="" className="h-7 w-7 object-contain" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
            <p className="text-xs text-[var(--text-muted)]">Public profile handle</p>
          </div>
        </div>
        <span className="text-[var(--text-muted)]">{icon}</span>
      </div>

      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.trim())}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border bg-[var(--bg-input)] px-3.5 pr-10 font-mono text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          style={{
            borderColor:
              status === 'valid'
                ? 'rgba(52,199,123,0.5)'
                : status === 'invalid'
                  ? 'rgba(240,85,79,0.55)'
                  : 'var(--border-subtle)',
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === 'checking' && <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />}
          {status === 'valid' && <CheckCircle2 size={14} className="text-[var(--accent-green)]" />}
          {status === 'invalid' && <XCircle size={14} className="text-[var(--color-danger)]" />}
        </span>
      </div>

      {status === 'invalid' && <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>}
      {children}
    </div>
  );
}

function PreviewRow({ image, name, meta }: { image: string | null; name: string; meta: string }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-[rgba(52,199,123,0.22)] bg-[rgba(52,199,123,0.08)] p-3">
      {image ? <Image src={image} width={36} height={36} alt="" className="h-9 w-9 rounded-lg object-cover" unoptimized /> : <div className="h-9 w-9 rounded-lg bg-[var(--bg-elevated)]" />}
      <div className="min-w-0">
        <p className="truncate font-mono text-sm font-semibold text-[var(--text-primary)]">{name}</p>
        <p className="truncate text-xs text-[var(--text-secondary)]">{meta}</p>
      </div>
    </div>
  );
}
