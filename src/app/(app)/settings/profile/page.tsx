'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GlassCard } from '@/components/shared/GlassCard';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Loader2 } from 'lucide-react';

interface ProfileData {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setBio(profile.bio ?? '');
      setIsDirty(false);
    }
  }, [profile]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: { displayName: string; bio: string }) => {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      setIsDirty(false);
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ displayName, bio });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-xl" style={{ background: 'var(--bg-surface-2)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard padding="lg">
        <h2 className="mb-6 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          Profile Details
        </h2>

        <div className="mb-8 flex items-center gap-6">
          <div className="group relative">
            <div className="rounded-full bg-[var(--bg-surface-3)] p-1">
              <UserAvatar
                src={profile?.avatarUrl}
                name={profile?.displayName ?? profile?.username ?? ''}
                size={88}
              />
            </div>
            <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <span className="text-xs font-semibold text-white">Edit</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {profile?.displayName ?? profile?.username}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Avatar is synced from your connected account.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Username
            </label>
            <input
              type="text"
              value={profile?.username ?? ''}
              disabled
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-50"
              style={{
                background: 'var(--bg-surface-3)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. John Doe"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand)] hover:border-[var(--border-strong)]"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-end justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Bio
              </label>
              <span className="font-mono-data text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                {bio.length} / 160
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setIsDirty(true);
              }}
              maxLength={160}
              rows={3}
              placeholder="Tell us a little about yourself"
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand)] hover:border-[var(--border-strong)]"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={isPending || !isDirty}
              className="flex h-10 items-center justify-center rounded-lg px-6 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent-primary)', color: '#fff' }}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
