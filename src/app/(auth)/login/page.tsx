'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { getRedirectResult, GoogleAuthProvider, signInWithEmailAndPassword, signInWithRedirect } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { EASE_OUT_FAST } from '@/lib/animations';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

async function createSession(idToken: string) {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error?.message ?? 'Session creation failed. Please try again.');
  }
  return data as { ok: true; onboarded: boolean };
}

async function resolveIdentifier(identifier: string) {
  const res = await fetch(`/api/auth/resolve-identifier?identifier=${encodeURIComponent(identifier)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Account not found.');
  return data.email as string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const handledGoogleRedirect = useRef(false);

  const finishSession = useCallback(async (idToken: string) => {
    const data = await createSession(idToken);
    if (redirectTo && redirectTo.startsWith('/') && data.onboarded) {
      router.push(redirectTo);
      return;
    }
    router.push(data.onboarded ? '/dashboard' : '/link-account');
  }, [redirectTo, router]);

  useEffect(() => {
    if (handledGoogleRedirect.current) return;
    handledGoogleRedirect.current = true;

    getRedirectResult(auth)
      .then(async (credential) => {
        if (!credential) return;
        setGoogleLoading(true);
        await finishSession(await credential.user.getIdToken(true));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
      })
      .finally(() => setGoogleLoading(false));
  }, [finishSession]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = await resolveIdentifier(identifier.trim());
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await finishSession(await credential.user.getIdToken(true));
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const message =
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Arc ID or password is incorrect.'
          : err instanceof Error
            ? err.message
            : 'Could not sign in. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user') setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={EASE_OUT_FAST}>
      <section className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[rgba(17,17,20,0.92)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="border-b border-[var(--border-subtle)] px-7 py-5 text-center">
          <Image src="/logo.png" width={44} height={44} alt="Arc" className="mx-auto h-11 w-11 object-contain" priority />
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Sign in with Google or your Arc user ID to continue linking your handles.
          </p>
        </div>

        <div className="px-7 py-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">or</span>
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">Arc user ID</span>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                required
                autoComplete="username"
                placeholder="arc_developer"
                className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[rgba(79,110,247,0.65)]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">Password</span>
              <span className="relative block">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3.5 pr-10 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[rgba(79,110,247,0.65)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-[var(--color-danger)]">
                <AlertCircle size={14} />
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-blue)] text-sm font-semibold text-white shadow-[0_14px_34px_rgba(79,110,247,0.24)] hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <ArrowRight size={15} className="group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            New to Arc?{' '}
            <Link href="/signup" className="font-medium text-[var(--accent-blue)] hover:text-[var(--text-primary)]">
              Create account
            </Link>
          </p>
        </div>
      </section>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
