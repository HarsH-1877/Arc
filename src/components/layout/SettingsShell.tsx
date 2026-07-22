'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Link2, Bell, AlertTriangle } from 'lucide-react';

const SETTINGS_NAV = [
  { label: 'Profile', href: '/settings/profile', icon: User },
  { label: 'Security', href: '/settings/security', icon: Shield },
  { label: 'Connections', href: '/settings/connections', icon: Link2 },
  { label: 'Notifications', href: '/settings/notifications', icon: Bell },
  { label: 'Danger Zone', href: '/settings/danger', icon: AlertTriangle, danger: true },
];

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56 sticky top-8 self-start">
          <div className="mb-5 px-3">
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
                  className="flex items-center gap-3 rounded-md px-3 py-[11px] text-sm font-medium hover:bg-[var(--bg-card-hover)] transition-colors"
                  style={{
                    color,
                    background: bg,
                    borderLeft: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                    boxShadow: isActive && !item.danger ? '-2px 0 12px var(--brand-dim)' : 'none',
                  }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: isActive ? (item.danger ? 'rgba(251,113,133,0.15)' : 'var(--brand-dim)') : 'var(--bg-surface-2)', color: isActive ? (item.danger ? 'var(--accent-rose)' : 'var(--brand)') : 'var(--text-tertiary)' }}>
                    <item.icon size={14} />
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
