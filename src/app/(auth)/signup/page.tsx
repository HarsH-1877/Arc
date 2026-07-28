'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { AuthStepper } from '@/components/auth/AuthStepper';
import { useDebounce } from '@/hooks/useDebounce';
import { auth } from '@/lib/firebase/client';
import { EASE_OUT_FAST } from '@/lib/animations';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

async function createSession(idToken: string, username: string) {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, username }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error?.message ?? 'Arc could not start a secure session. Please try again.');
  }
}

function passwordScore(password: string) {
  return Number(password.length >= 8) + Number(/[A-Z]/.test(password)) + Number(/[0-9]/.test(password)) + Number(/[^A-Za-z0-9]/.test(password));
}

function isGoogleUser(user: User | null) {
  return Boolean(user?.providerData.some((provider) => provider.providerId === 'google.com'));
}

function describeFirebaseError(error: unknown) {
  const code = (error as { code?: string }).code;
  const messages: Record<string, string> = {
    'auth/operation-not-allowed': 'Google sign-in is not enabled for this Firebase project. Enable Google under Firebase Authentication > Sign-in method.',
    'auth/unauthorized-domain': 'This domain is not authorised in Firebase. Add localhost under Firebase Authentication > Settings > Authorised domains.',
    'auth/invalid-api-key': 'The Firebase web API key is invalid. Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local.',
    'auth/network-request-failed': 'Google sign-in could not reach Firebase. Check your connection and try again.',
    'auth/credential-already-in-use': 'Those Arc credentials are already connected to another account. Choose a different Arc user ID.',
    'auth/email-already-in-use': 'That Arc user ID is already in use. Choose a different one.',
    'auth/provider-already-linked': 'These Arc credentials are already connected. Continue to link your coding handles.',
    'auth/weak-password': 'Password must be at least 6 characters.',
  };
  return messages[code ?? ''] ?? (error instanceof Error ? error.message : 'Something went wrong. Please try again.');
}

export default function SignupPage() {
  const router = useRouter();
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const debouncedUsername = useDebounce(username, 350);
  const score = passwordScore(password);
  const step = googleUser ? 1 : 0;

  useEffect(() => {
    if (!googleUser || !debouncedUsername) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(debouncedUsername)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    fetch(`/api/auth/check-username?username=${encodeURIComponent(debouncedUsername.toLowerCase())}`)
      .then((response) => response.json())
      .then((data) => setUsernameStatus(data.available ? 'available' : 'taken'))
      .catch(() => setUsernameStatus('idle'));
  }, [debouncedUsername, googleUser]);

  const finishCredentials = useCallback(async () => {
    if (!googleUser) throw new Error('Select a Google account before setting Arc credentials.');
    const cleanUsername = username.toLowerCase();
    const credential = EmailAuthProvider.credential(`${cleanUsername}@arc.local`, password);

    try {
      await linkWithCredential(googleUser, credential);
    } catch (linkError: unknown) {
      if ((linkError as { code?: string }).code !== 'auth/provider-already-linked') throw linkError;
    }

    await updateProfile(auth.currentUser ?? googleUser, { displayName: cleanUsername });
    await createSession(await (auth.currentUser ?? googleUser).getIdToken(true), cleanUsername);
    router.push('/link-account');
  }, [googleUser, password, router, username]);

  const handleCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (usernameStatus !== 'available') {
      setError('Choose an available Arc user ID first.');
      return;
    }

    setLoading(true);
    try {
      await finishCredentials();
    } catch (credentialsError: unknown) {
      setError(describeFirebaseError(credentialsError));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      if (!isGoogleUser(credential.user)) {
        throw new Error('The selected account could not be verified with Google. Please try again.');
      }
      setGoogleUser(credential.user);
    } catch (googleError: unknown) {
      setError(describeFirebaseError(googleError));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={EASE_OUT_FAST}>
      <AuthStepper current={step} />
      <section className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[rgba(17,17,20,0.92)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="border-b border-[var(--border-subtle)] px-7 py-5 text-center">
          <Image src="/logo.png" width={96} height={96} alt="Arc" className="mx-auto h-24 w-24 object-contain" priority />
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {step === 0 ? 'Create your account' : 'Choose your Arc credentials'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {step === 0
              ? 'Start by choosing the Google account you want to use with Arc.'
              : 'Set an Arc user ID and password, then connect your coding handles.'}
          </p>
        </div>

        <div className="px-7 py-6">
          {step === 0 || !googleUser ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>
              {error && <ErrorMessage message={error} />}
            </div>
          ) : (
            <form onSubmit={handleCredentials} className="space-y-3.5">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-3">
                {googleUser.photoURL ? <Image src={googleUser.photoURL} width={28} height={28} alt="" className="h-7 w-7 rounded-full" unoptimized /> : <GoogleIcon />}
                <p className="min-w-0 truncate text-sm text-[var(--text-secondary)]">{googleUser.email ?? googleUser.displayName ?? 'Google account connected'}</p>
                <CheckCircle2 size={16} className="ml-auto shrink-0 text-[var(--accent-green)]" />
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">Arc user ID</span>
                <span className="relative block">
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value.toLowerCase())}
                    required
                    placeholder="arc_developer"
                    autoComplete="username"
                    className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3.5 pr-10 font-mono text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[rgba(79,110,247,0.65)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />}
                    {usernameStatus === 'available' && <CheckCircle2 size={14} className="text-[var(--accent-green)]" />}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle size={14} className="text-[var(--color-danger)]" />}
                  </span>
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">Password</span>
                <span className="relative block">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create password"
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
                {password.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((item) => <span key={item} className="h-1 rounded-full" style={{ background: item <= score ? 'var(--accent-blue)' : 'var(--bg-elevated)' }} />)}
                  </div>
                )}
              </label>

              {error && <ErrorMessage message={error} />}

              <button
                type="submit"
                disabled={loading || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-blue)] text-sm font-semibold text-white shadow-[0_14px_34px_rgba(79,110,247,0.24)] hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ArrowRight size={15} className="group-hover:translate-x-0.5" /></>}
              </button>
            </form>
          )}
        </div>
      </section>
    </motion.div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 text-xs leading-5 text-[var(--color-danger)]">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      {message}
    </motion.p>
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
