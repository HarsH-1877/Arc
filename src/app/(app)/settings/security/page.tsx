'use client';

import { useQuery } from '@tanstack/react-query';
import { GlassCard } from '@/components/shared/GlassCard';
import { Mail, Github, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function SecuritySettingsPage() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const strength = (() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  })();

  const handlePasswordUpdate = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password update queued', {
      description: 'Will apply via Firebase when backend auth is connected.',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      <GlassCard padding="lg">
        <h2 className="mb-6 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          Sign-in methods
        </h2>
        <div className="max-w-md space-y-3">
          <div
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)' }}
          >
            <Mail size={18} style={{ color: 'var(--text-tertiary)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Email
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {profile?.email ?? '—'}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-3 rounded-lg border px-4 py-3 opacity-80"
            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)' }}
          >
            <Chrome size={18} style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Google — managed in Firebase
            </p>
          </div>
          <div
            className="flex items-center gap-3 rounded-lg border px-4 py-3 opacity-80"
            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)' }}
          >
            <Github size={18} style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              GitHub — managed in Firebase
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <h2 className="mb-6 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          Change password
        </h2>
        <div className="max-w-md space-y-4">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          {newPassword.length > 0 && (
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  style={{
                    background:
                      i <= strength
                        ? strength <= 1
                          ? 'var(--color-danger)'
                          : strength === 2
                            ? 'var(--color-warning)'
                            : 'var(--accent-green)'
                        : 'var(--bg-surface-3)',
                  }}
                />
              ))}
            </div>
          )}
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            onClick={handlePasswordUpdate}
            disabled={!newPassword || !confirmPassword}
            className="h-10 rounded-lg px-6 text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
          >
            Update password
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
