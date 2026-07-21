'use client';

import { GlassCard } from '@/components/shared/GlassCard';
import { Bell, UserPlus, TrendingUp, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const TOGGLES = [
  {
    id: 'friendRequests',
    icon: UserPlus,
    label: 'Friend requests',
    description: 'When someone sends you a friend request.',
  },
  {
    id: 'friendAccepted',
    icon: Bell,
    label: 'Friend accepted',
    description: 'When someone accepts your friend request.',
  },
  {
    id: 'ratingChanges',
    icon: TrendingUp,
    label: 'Rating change alerts',
    description: 'When your Codeforces or LeetCode rating changes by 50+ points.',
  },
  {
    id: 'syncComplete',
    icon: RefreshCw,
    label: 'Sync completion',
    description: 'When a platform sync finishes successfully.',
  },
] as const;

type ToggleId = (typeof TOGGLES)[number]['id'];

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<Record<ToggleId, boolean>>({
    friendRequests: true,
    friendAccepted: true,
    ratingChanges: true,
    syncComplete: true,
  });

  const toggle = (id: ToggleId) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <GlassCard padding="lg">
        <h2 className="mb-2 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          In-app notifications
        </h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Control what appears in your notification bell. Preferences are stored locally for now.
        </p>

        <div className="max-w-md space-y-3">
          {TOGGLES.map(({ id, icon: Icon, label, description }) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-1 items-center gap-3 pr-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--bg-surface-3)', color: 'var(--text-tertiary)' }}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[id]}
                onClick={() => toggle(id)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
                style={{ background: prefs[id] ? 'var(--brand)' : 'var(--bg-surface-3)' }}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200"
                  style={{ transform: prefs[id] ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
