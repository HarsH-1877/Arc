'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Link2, Bell, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const SETTINGS_NAV = [
  { label: 'Profile', href: '/settings/profile', icon: User },
  { label: 'Security', href: '/settings/security', icon: Shield },
  { label: 'Connections', href: '/settings/connections', icon: Link2 },
  { label: 'Notifications', href: '/settings/notifications', icon: Bell },
  { label: 'Danger Zone', href: '/settings/danger', icon: AlertTriangle, danger: true },
];

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const isGuest = profile?.isGuest;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56 sticky top-8 self-start">
          <div className="mb-4 px-3">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          </div>
          <nav className="flex flex-col gap-1">
            {SETTINGS_NAV.map((item) => {
              const isActive = pathname === item.href;
              const color = item.danger
                ? isActive ? 'var(--accent-rose)' : 'var(--text-secondary)'
                : isActive ? 'var(--text-primary)' : 'var(--text-secondary)';
              const bg = isActive
                ? item.danger
                  ? 'rgba(251,113,133,0.1)'
                  : 'linear-gradient(90deg, rgba(79,142,247,0.18) 0%, transparent 100%)'
                : 'transparent';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-md px-3 py-[11px] text-sm font-medium hover:bg-[var(--bg-card-hover)] transition-colors"
                  style={{
                    color,
                    background: bg,
                    borderLeft: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                    boxShadow: isActive && !item.danger ? '-2px 0 12px var(--brand-dim)' : 'none',
                  }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full group-hover:scale-110 transition-transform duration-200" style={{ background: isActive ? (item.danger ? 'rgba(251,113,133,0.15)' : 'var(--brand-dim)') : 'var(--bg-surface-2)', color: isActive ? (item.danger ? 'var(--accent-rose)' : 'var(--brand)') : 'var(--text-tertiary)' }}>
                    <item.icon size={14} />
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {isGuest && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <span>
                  You are exploring settings in <strong>Guest Mode</strong>. Actions like connecting handles, updating profiles, and changing security credentials are read-only.
                </span>
              </div>
              <Link
                href="/signup?fresh=1"
                className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 font-bold text-black hover:bg-amber-300 transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
