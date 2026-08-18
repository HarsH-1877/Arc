'use client';

import { Bell, CalendarClock, CheckCircle2, ChevronDown, Sun, RefreshCw, Menu, UserPlus } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GoalSetter } from '@/components/layout/GoalSetter';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { AnimatePresence, motion } from 'framer-motion';
import { useDismissOnOutsideClick } from '@/hooks/useDismissOnOutsideClick';
import { useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface TopbarProps {
  notificationCount?: number;
  userDisplayName?: string;
}

export function Topbar({ notificationCount = 0 }: TopbarProps) {
  const pathname = usePathname();
  const isProblemsPage = pathname === '/problems' || pathname.startsWith('/problems/');
  const isContestHistoryPage = pathname === '/contest-history' || pathname.startsWith('/contest-history/');

  const { toggleMobileSidebar, selectedPlatform, setSelectedPlatform } = useUIStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const platformMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useNotifications();
  const { mutate: markNotificationRead } = useMarkNotificationRead();
  useDismissOnOutsideClick(platformMenuRef, () => setPlatformOpen(false), platformOpen);
  useDismissOnOutsideClick(notificationMenuRef, () => setNotificationsOpen(false), notificationsOpen);
  const unreadCount = notifications.filter((notification) => !notification.read).length || notificationCount;

  const availablePlatforms = isContestHistoryPage
    ? (['ALL', 'CODEFORCES', 'LEETCODE'] as const)
    : (['CODEFORCES', 'LEETCODE'] as const);

  // When leaving contest-history, reset ALL → CODEFORCES so other pages get a valid platform
  useEffect(() => {
    if (!isContestHistoryPage && selectedPlatform === 'ALL') {
      setSelectedPlatform('CODEFORCES');
    }
  }, [isContestHistoryPage, selectedPlatform, setSelectedPlatform]);

  const displayPlatform = (!isContestHistoryPage && selectedPlatform === 'ALL') ? 'CODEFORCES' : selectedPlatform;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/platforms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error('Unable to sync connected platforms');
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex w-full shrink-0 items-center" style={{ height: '64px', padding: '0 22px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(11,13,20,0.68)', backdropFilter: 'blur(12px)' }}>
      <div className="flex flex-1 items-center gap-4">
        <button onClick={toggleMobileSidebar} className="flex items-center justify-center lg:hidden" style={{ color: 'var(--text-muted)' }} aria-label="Open menu">
          <Menu size={20} />
        </button>

        <GoalSetter platform={selectedPlatform} />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        {!isProblemsPage && (
          <div ref={platformMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setPlatformOpen((value) => !value)}
              className="flex min-w-[148px] items-center justify-between gap-2 rounded-full"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '7px 13px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <div className="flex items-center gap-2">
                {displayPlatform !== 'ALL' && <PlatformLogo platform={displayPlatform} size={22} active={true} />}
                {displayPlatform === 'ALL' ? '🌐 All Platforms' : displayPlatform === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'}
              </div>
              <ChevronDown size={14} className={cn('opacity-50 transition-transform duration-200', platformOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
            {platformOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute right-0 top-[calc(100%+4px)] z-50 w-full origin-top rounded-[18px] p-1.5"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: '0 18px 48px rgba(0,0,0,0.56)' }}
              >
                {availablePlatforms.filter(item => item !== displayPlatform).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSelectedPlatform(item);
                      setPlatformOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-card-hover)] transition-colors"
                    style={{ background: 'transparent', color: 'var(--text-primary)' }}
                  >
                    {item !== 'ALL' && <PlatformLogo platform={item} size={20} active={true} />}
                    {item === 'ALL' ? '🌐 All Platforms' : item === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'}
                  </button>
                ))}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )}

        <div ref={notificationMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative flex items-center justify-center rounded-full"
            style={{ width: '32px', height: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            aria-label={`${unreadCount} unread notifications`}
            aria-expanded={notificationsOpen}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full" style={{ background: 'var(--danger)' }}>
                <span className="absolute inset-0 rounded-full" style={{ background: 'var(--danger)', animation: 'notificationPulse 1.5s infinite' }} />
              </span>
            )}
          </button>
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] overflow-hidden rounded-xl"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: '0 20px 52px rgba(0,0,0,0.58)' }}
              >
                <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                  <span className="font-mono-data text-[10px]" style={{ color: 'var(--text-muted)' }}>{unreadCount} unread</span>
                </div>
                <div className="max-h-[360px] overflow-y-auto p-1.5">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>You&apos;re all caught up.</div>
                  ) : notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        if (!notification.read) markNotificationRead(notification.id);
                        const href = notification.metadata?.href;
                        if (typeof href === 'string') window.open(href, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left hover:bg-white/[0.04]"
                      style={{ background: notification.read ? 'transparent' : 'var(--accent-blue-dim)' }}
                    >
                      <NotificationIcon type={notification.type} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="truncate text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{notification.title}</span>
                          <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(notification.createdAt)}</span>
                        </span>
                        <span className="mt-1 block text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>{notification.body}</span>
                      </span>
                      {!notification.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent-blue)' }} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="hidden items-center justify-center rounded-full sm:flex" style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }} aria-label="Theme">
          <Sun size={18} />
        </button>

        <button onClick={handleRefresh} className="flex items-center justify-center rounded-full" style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} aria-label="Refresh data">
          <RefreshCw size={16} className={cn(isRefreshing && 'animate-spin')} />
        </button>
      </div>
    </header>
  );
}

function NotificationIcon({ type }: { type: string }) {
  const Icon = type === 'CONTEST_REMINDER'
    ? CalendarClock
    : type === 'FRIEND_ACCEPTED'
      ? CheckCircle2
      : UserPlus;
  const color = type === 'CONTEST_REMINDER' ? 'var(--accent-amber)' : type === 'FRIEND_ACCEPTED' ? 'var(--accent-green)' : 'var(--accent-blue)';
  return <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--bg-input)', color }}><Icon size={14} /></span>;
}
