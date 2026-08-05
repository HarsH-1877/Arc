'use client';

import type { SyncStatus } from '@prisma/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/shared/Card';
import { SyncStatusDot } from '@/components/shared/SyncStatusDot';
import { CheckCircle2, Loader2, RefreshCw, Unlink, Plus } from 'lucide-react';
import { useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { PlatformLogo } from '@/components/shared/PlatformLogo';

interface PlatformData {
  handle: string;
  syncStatus: string;
  lastSyncedAt: string | null;
  syncError?: string | null;
}

export default function ConnectionsSettingsPage() {
  const queryClient = useQueryClient();
  const [linkingPlatform, setLinkingPlatform] = useState<'CODEFORCES' | 'LEETCODE' | null>(null);
  const [syncingPlatform, setSyncingPlatform] = useState<'CODEFORCES' | 'LEETCODE' | null>(null);
  const [unlinkingPlatform, setUnlinkingPlatform] = useState<'CODEFORCES' | 'LEETCODE' | null>(null);
  const [cfHandle, setCfHandle] = useState('');
  const [lcHandle, setLcHandle] = useState('');
  const [cfError, setCfError] = useState('');
  const [lcError, setLcError] = useState('');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch connections');
      return res.json();
    },
    refetchInterval: 4000,
  });

  const { mutate: linkPlatform } = useMutation({
    mutationFn: async ({ platform, handle }: { platform: 'CODEFORCES' | 'LEETCODE'; handle: string }) => {
      const res = await fetch('/api/platforms/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, handle }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to link');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (variables.platform === 'CODEFORCES') setCfHandle('');
      else setLcHandle('');
    },
  });

  const { mutate: unlinkPlatform } = useMutation({
    mutationFn: async (platform: string) => {
      const res = await fetch('/api/platforms/unlink', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error('Failed to unlink');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });

  const { mutate: syncPlatformMutation } = useMutation({
    mutationFn: async (platform: string) => {
      const res = await fetch('/api/platforms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error('Failed to sync');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    onSettled: () => {
      // Force an immediate refetch so syncStatus reflects the latest DB state
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleLink = (platform: 'CODEFORCES' | 'LEETCODE', handle: string) => {
    if (platform === 'CODEFORCES') setCfError('');
    else setLcError('');

    setLinkingPlatform(platform);
    linkPlatform(
      { platform, handle },
      {
        onError: (err) => {
          if (platform === 'CODEFORCES') setCfError(err.message);
          else setLcError(err.message);
        },
        onSettled: () => setLinkingPlatform(null),
      },
    );
  };

  const handleSync = (platform: 'CODEFORCES' | 'LEETCODE') => {
    setSyncingPlatform(platform);
    syncPlatformMutation(platform, {
      onSettled: () => setSyncingPlatform(null),
    });
  };

  const handleUnlink = (platform: 'CODEFORCES' | 'LEETCODE') => {
    setUnlinkingPlatform(platform);
    unlinkPlatform(platform, {
      onSettled: () => setUnlinkingPlatform(null),
    });
  };

  if (isLoading) {
    return <div className="skeleton h-40 w-full" />;
  }

  const cf = dashboard?.platforms?.codeforces as PlatformData | null | undefined;
  const lc = dashboard?.platforms?.leetcode as PlatformData | null | undefined;

  return (
    <div className="space-y-6">
      <Card padding="22px" className="gap-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Connected Platforms</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Link your coding profiles to import your stats, ratings, and submission history.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PlatformCard
            name="Codeforces"
            platform="CODEFORCES"
            data={cf}
            handle={cfHandle}
            setHandle={setCfHandle}
            error={cfError}
            isLinking={linkingPlatform === 'CODEFORCES'}
            isSyncing={syncingPlatform === 'CODEFORCES'}
            isUnlinking={unlinkingPlatform === 'CODEFORCES'}
            onLink={handleLink}
            onSync={handleSync}
            onUnlink={handleUnlink}
          />
          <PlatformCard
            name="LeetCode"
            platform="LEETCODE"
            data={lc}
            handle={lcHandle}
            setHandle={setLcHandle}
            error={lcError}
            isLinking={linkingPlatform === 'LEETCODE'}
            isSyncing={syncingPlatform === 'LEETCODE'}
            isUnlinking={unlinkingPlatform === 'LEETCODE'}
            onLink={handleLink}
            onSync={handleSync}
            onUnlink={handleUnlink}
          />
        </div>
      </Card>

      <Card padding="22px" className="gap-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Coming soon</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {['AtCoder', 'HackerRank'].map((name) => (
            <div key={name} className="relative cursor-not-allowed rounded-lg border p-4 opacity-50" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
              <button type="button" className="absolute right-4 top-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                Notify me
              </button>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Platform integration planned</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PlatformCard({
  name,
  platform,
  data,
  handle,
  setHandle,
  error,
  isLinking,
  isSyncing,
  isUnlinking,
  onLink,
  onSync,
  onUnlink,
}: {
  name: string;
  platform: 'CODEFORCES' | 'LEETCODE';
  data?: PlatformData | null;
  handle: string;
  setHandle: (value: string) => void;
  error: string;
  isLinking: boolean;
  isSyncing: boolean;
  isUnlinking: boolean;
  onLink: (platform: 'CODEFORCES' | 'LEETCODE', handle: string) => void;
  onSync: (platform: 'CODEFORCES' | 'LEETCODE') => void;
  onUnlink: (platform: 'CODEFORCES' | 'LEETCODE') => void;
}) {
  // Only animate while our own mutation is in-flight. Once it settles, stop spinning
  // even if the DB poll hasn't caught up yet — avoids stuck spinner.
  const syncing = isSyncing;

  return (
    <div className="flex flex-col gap-4 rounded-lg p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <PlatformLogo platform={platform} size={36} />
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</h3>
            {data ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono-data rounded-md px-2 py-0.5 text-sm" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>{data.handle}</span>
                <CheckCircle2 size={15} aria-label="Account linked" style={{ color: 'var(--success)' }} />
                <SyncStatusDot status={data.syncStatus as SyncStatus} lastSyncedAt={data.lastSyncedAt} errorMessage={data.syncError ?? undefined} />
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Not connected</p>
            )}
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>{error}</div>}

      {data ? (
        <div className="border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <button onClick={() => onSync(platform)} disabled={syncing} className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold disabled:opacity-50" style={{ background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              {data.lastSyncedAt && <p className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>Last synced {formatRelativeTime(data.lastSyncedAt)}</p>}
            </div>
            <button onClick={() => onUnlink(platform)} disabled={isUnlinking} className="flex h-9 w-9 items-center justify-center rounded-md disabled:opacity-50 hover:bg-red-500/10 transition-colors" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', cursor: 'pointer' }} title="Unlink account" aria-label={'Unlink ' + name}>
              <Unlink size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <input type="text" placeholder={name + ' handle'} value={handle} onChange={(e) => setHandle(e.target.value)} className="h-9 min-w-0 flex-1 rounded-md px-3 text-xs outline-none" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
          <button onClick={() => onLink(platform, handle)} disabled={isLinking || !handle.trim()} className="flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold disabled:opacity-50" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
            {isLinking ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Link
          </button>
        </div>
      )}
    </div>
  );
}
