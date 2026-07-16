'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Grid, Users, BarChart2, Settings, Plus, LogOut, FolderOpen, Edit2, Inbox, Trophy, Share, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Grid },
  { label: 'Friends', href: '/friends', icon: Users },
  { label: 'Compare', href: '/compare', icon: BarChart2 },
  { label: 'Contest History', href: '/contest-history', icon: Trophy },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ mobile, profile }: { mobile?: boolean; profile?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const { data: requests } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const res = await fetch('/api/friends/requests');
      if (!res.ok) return [];
      return res.json();
    },
  });
  const pendingCount = Array.isArray(requests) ? requests.filter((r) => r.status === 'PENDING').length : 0;

  function isActive(href: string): boolean {
    if (href === '/settings') return pathname.startsWith('/settings');
    return pathname === href || pathname.startsWith(href + '/');
  }

  async function handleSignOut() {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {}
    router.push('/login');
  }

  const userDisplayName = profile?.displayName ?? profile?.username ?? 'User';
  const initials = getInitials(userDisplayName);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 76 : 260 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-screen shrink-0 flex-col overflow-visible"
      style={{
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
        padding: sidebarCollapsed ? '20px 10px' : '20px 14px',
      }}
    >
      <div className="min-h-0 flex-1 overflow-visible">
        <div className="mb-6 flex items-center justify-between overflow-hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center justify-center rounded-full p-[1.5px]" style={{ background: 'var(--brand)' }}>
              <div className="flex items-center justify-center rounded-full" style={{ width: '37px', height: '37px', background: 'var(--bg-elevated)' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{initials}</span>
              </div>
            </div>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Hello,</span>
                <span className="block truncate" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>{userDisplayName}</span>
              </motion.div>
            )}
          </div>

          {!sidebarCollapsed && (
            <button className="flex shrink-0 items-center justify-center rounded-full p-2 transition-colors hover:bg-[var(--bg-card-hover)]" style={{ color: 'var(--text-secondary)', cursor: 'pointer', border: 'none', background: 'transparent' }} aria-label="Share profile">
              <Share size={16} />
            </button>
          )}
        </div>

        <nav className="flex flex-col gap-1 overflow-visible">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex items-center gap-3 overflow-visible rounded-md px-3 py-[11px] hover:bg-[var(--bg-card-hover)]"
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  textDecoration: 'none',
                }}
              >
                {active && (
                  <motion.span
                    layoutId={mobile ? 'mobile-sidebar-active' : 'sidebar-active'}
                    className="absolute inset-0"
                    style={{
                      borderLeft: '2px solid var(--brand)',
                      background: 'linear-gradient(90deg, var(--brand-dim) 0%, transparent 100%)',
                      boxShadow: '-2px 0 12px var(--brand-dim)',
                    }}
                    transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.8 }}
                  />
                )}
                <Icon size={18} className="relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:text-[var(--text-primary)]" />
                {!sidebarCollapsed && <span className="relative z-10 text-sm group-hover:text-[var(--text-primary)]">{item.label}</span>}
                
                {sidebarCollapsed && (
                  <div className="pointer-events-none absolute left-full ml-4 opacity-0 transition-all group-hover:ml-3 group-hover:opacity-100 z-50 rounded-md px-3 py-1.5 text-xs font-semibold shadow-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

        </nav>
      </div>

      <div className="mt-4 flex shrink-0 flex-col gap-3 overflow-hidden">
        {!sidebarCollapsed && (
          <div style={{ background: 'linear-gradient(var(--bg-card), var(--bg-card)) padding-box, linear-gradient(135deg, var(--accent-blue), var(--accent-purple)) border-box', border: '1px solid transparent', borderRadius: 'var(--r-md)', padding: '12px' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Connect accounts</h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>Link coding profiles.</p>
            <button onClick={() => router.push('/settings/connections')} className="mt-3 w-full rounded-full border-0" style={{ background: 'var(--accent-blue)', color: '#fff', padding: '7px', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer' }}>
              Add account
            </button>
          </div>
        )}

        <button onClick={handleSignOut} className="group relative flex w-full items-center gap-3 overflow-visible rounded-md border-0 bg-transparent px-3 py-[11px] text-left hover:bg-white/[0.04] hover:text-[var(--text-primary)]" style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <LogOut size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {!sidebarCollapsed && <span className="text-sm">Sign out</span>}
          {sidebarCollapsed && (
            <div className="pointer-events-none absolute left-full ml-4 opacity-0 transition-all group-hover:ml-3 group-hover:opacity-100 z-50 rounded-md px-3 py-1.5 text-xs font-semibold shadow-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              Sign out
            </div>
          )}
        </button>

        <button onClick={toggleSidebar} className="group flex w-full items-center justify-center rounded-md border-0 bg-transparent py-[11px] hover:bg-white/[0.04] hover:text-[var(--text-primary)] hidden lg:flex" style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
          {sidebarCollapsed ? <PanelLeftOpen size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" /> : <PanelLeftClose size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />}
        </button>
      </div>
    </motion.aside>
  );
}
