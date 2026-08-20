'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GlassCard } from '@/components/shared/GlassCard';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Loader2, Github, Linkedin, Globe } from 'lucide-react';

interface ProfileData {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
}

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient();
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSocialDirty, setIsSocialDirty] = useState(false);

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
      setBio(profile.bio ?? '');
      setGithubUrl(profile.githubUrl ?? '');
      setLinkedinUrl(profile.linkedinUrl ?? '');
      setWebsiteUrl(profile.websiteUrl ?? '');
      setIsDirty(false);
      setIsSocialDirty(false);
    }
  }, [profile]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: { bio: string }) => {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, githubUrl, linkedinUrl, websiteUrl }),
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
    updateProfile({ bio });
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
      <GlassCard padding="xl">
        <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Profile Settings
        </h2>
        <p className="mb-10 mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage your public identity and profile details.
        </p>

        <div className="flex flex-col gap-10 md:flex-row md:items-start">
          <div className="flex w-full flex-col items-center gap-4 rounded-xl p-8 md:w-64 md:shrink-0 hover:border-[var(--border-strong)] transition-colors" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
            <div className="group relative">
              <div className="rounded-full bg-[var(--bg-surface-3)] p-1.5 shadow-sm">
                <UserAvatar
                  src={profile?.avatarUrl}
                  name={profile?.username ?? ''}
                  size={110}
                />
              </div>
              <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <span className="text-[11px] font-semibold text-white tracking-wide">CHANGE</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {profile?.username}
              </p>
              <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-tertiary)' }}>
                @{profile?.username}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-7">
            <div className="grid gap-7">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={profile?.username ?? ''}
                  disabled
                  className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none disabled:opacity-50"
                  style={{
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

            </div>

            <div>
              <div className="mb-2 flex items-end justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Bio
                </label>
                <span className="font-mono-data text-[10px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
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
                rows={5}
                placeholder="Tell us a little about yourself"
                className="w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--brand)] hover:border-[var(--border-strong)]"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
                }}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending || !isDirty}
                className="flex w-full h-11 items-center justify-center rounded-lg text-sm font-bold tracking-wide transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--accent-primary)', color: '#fff', boxShadow: '0 4px 12px rgba(79,142,247,0.25)' }}
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </GlassCard>

      <GlassCard padding="xl">
        <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Social Accounts
        </h2>
        <p className="mb-8 mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Link your professional platforms to be displayed on your public profile.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                <Linkedin size={14} />
                LinkedIn Profile
              </label>
              <input
                type="url"
                pattern=".*linkedin\.com/.*"
                title="Must be a valid LinkedIn URL (e.g. https://linkedin.com/in/username)"
                value={linkedinUrl}
                onChange={(e) => {
                  setLinkedinUrl(e.target.value);
                  setIsSocialDirty(true);
                }}
                placeholder="https://linkedin.com/in/username"
                className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--brand)] hover:border-[var(--border-strong)]"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                <Github size={14} />
                GitHub Profile
              </label>
              <input
                type="url"
                pattern=".*github\.com/.*"
                title="Must be a valid GitHub URL (e.g. https://github.com/username)"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  setIsSocialDirty(true);
                }}
                placeholder="https://github.com/username"
                className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--brand)] hover:border-[var(--border-strong)]"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                <Globe size={14} />
                Personal Website
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  setIsSocialDirty(true);
                }}
                placeholder="https://yourwebsite.com"
                className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--brand)] hover:border-[var(--border-strong)]"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || !isSocialDirty}
              className="flex w-full h-11 items-center justify-center rounded-lg text-sm font-bold tracking-wide transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent-primary)', color: '#fff', boxShadow: '0 4px 12px rgba(79,142,247,0.25)' }}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Links'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
