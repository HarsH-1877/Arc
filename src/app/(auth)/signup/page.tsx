'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle2, XCircle, Loader2, Github } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { GlassCard } from '@/components/shared/GlassCard';
import { EASE_OUT_FAST } from '@/lib/animations';
import { useDebounce } from '@/hooks/useDebounce';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

async function createSession(idToken: string, username?: string) {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, username }),
  });
  return res.json();
}

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] ?? '' };
}

const strengthColors = [
  '',
  'var(--color-danger)',
  'var(--color-warning)',
  'var(--accent-cyan)',
  'var(--accent-green)',
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');

  const debouncedUsername = useDebounce(username, 400);

  useEffect(() => {
    if (!debouncedUsername) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(debouncedUsername)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    fetch(`/api/auth/check-username?username=${encodeURIComponent(debouncedUsername)}`)
      .then((r) => r.json())
      .then((data) => setUsernameStatus(data.available ? 'available' : 'taken'))
      .catch(() => setUsernameStatus('idle'));
  }, [debouncedUsername]);

  const handleFirebaseError = (code: string) => {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
    };
    return messages[code] ?? 'Something went wrong. Please try again.';
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (usernameStatus !== 'available') {
      setError('Please choose a valid, available username.');
      return;
    }
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: username });
      const idToken = await credential.user.getIdToken();
      const data = await createSession(idToken, username);
      if (data.ok) {
        router.push('/onboarding');
      } else {
        setError('Session creation failed. Please try again.');
      }
    } catch (err: unknown) {
      setError(handleFirebaseError((err as { code?: string }).code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: GoogleAuthProvider | GithubAuthProvider, setLoading: (v: boolean) => void) => {
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();
      const data = await createSession(idToken);
      if (data.ok) {
        router.push(data.onboarded ? '/dashboard' : '/onboarding');
      } else {
        setError('Session creation failed. Please try again.');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code !== 'auth/popup-closed-by-user') setError(handleFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => handleOAuthSignup(googleProvider, setGoogleLoading);
  const handleGithubSignup = () => handleOAuthSignup(githubProvider, setGithubLoading);

  const passwordStrength = getPasswordStrength(password);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={EASE_OUT_FAST}>
      <GlassCard padding="lg" className="w-full">
        <div className="mb-8 text-center">
          <p className="mb-3 font-mono text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
            arc
          </p>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
            Create your account
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Link your coding platforms in 60 seconds.
          </p>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={googleLoading || githubLoading || loading}
          className="mb-3 flex h-11 w-full items-center justify-center gap-3 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--bg-surface-3)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
        >
          {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <button
          onClick={handleGithubSignup}
          disabled={googleLoading || githubLoading || loading}
          className="mb-3 flex h-11 w-full items-center justify-center gap-3 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--bg-surface-3)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
        >
          {githubLoading ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
          Continue with GitHub
        </button>

        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>or</span>
          <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border px-3 text-sm outline-none transition-colors"
              style={{ background: 'var(--bg-surface-3)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(124,58,237,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="signup-username" className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Username
            </label>
            <div className="relative">
              <input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                placeholder="coolcoder"
                className="h-11 w-full rounded-lg border px-3 pr-10 text-sm outline-none transition-colors"
                style={{ background: 'var(--bg-surface-3)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(124,58,237,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />}
                {usernameStatus === 'available' && <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <XCircle size={14} style={{ color: 'var(--color-danger)' }} />}
              </span>
            </div>
            {usernameStatus === 'taken' && <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>Username already taken.</p>}
            {usernameStatus === 'invalid' && <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>3–20 chars, letters, numbers and _ only.</p>}
            {usernameStatus === 'available' && <p className="mt-1 text-xs" style={{ color: 'var(--accent-green)' }}>Username is available!</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="signup-password" className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border px-3 pr-10 text-sm outline-none transition-colors"
                style={{ background: 'var(--bg-surface-3)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(124,58,237,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{ background: i <= passwordStrength.score ? strengthColors[passwordStrength.score] : 'var(--bg-surface-3)' }}
                  />
                ))}
                <span className="ml-2 min-w-[36px] text-xs" style={{ color: strengthColors[passwordStrength.score] }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-danger)' }}>
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading || githubLoading || usernameStatus === 'taken' || usernameStatus === 'checking' || usernameStatus === 'invalid'}
            className="mt-1 h-11 w-full rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: 'var(--radius-md)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating account…
              </span>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--accent-primary-light)' }}>
            Sign in
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
