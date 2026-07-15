'use client';

import { useUIStore } from '@/store/useUIStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useQuery } from '@tanstack/react-query';
import { useNotifications } from '@/hooks/useNotifications';
import { MOCK_PROFILE } from '@/lib/mock/data';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const pathname = usePathname();
  const accentLineRef = useRef<HTMLDivElement | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) return MOCK_PROFILE;
      return res.json();
    },
  });

  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setMobileSidebarOpen]);

  useEffect(() => {
    if (!accentLineRef.current) return;
    const tween = gsap.to(accentLineRef.current, {
      backgroundPosition: '200% 0',
      duration: 9,
      ease: 'none',
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="relative z-10 flex min-h-screen w-full overflow-hidden">
      <div
        className="relative flex min-h-screen w-full overflow-hidden"
        style={{
          background: 'var(--bg-page)',
          borderRadius: 0,
          boxShadow: 'none',
          maxWidth: 'none',
        }}
      >
        <div
          ref={accentLineRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, var(--brand) 20%, var(--brand) 82%, transparent 100%)',
            backgroundSize: '200% 100%',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        <div className="z-40 hidden lg:block">
          <Sidebar profile={profile} />
        </div>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-40 lg:hidden"
                style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.62)' }}
                onClick={() => setMobileSidebarOpen(false)}
              />
              <motion.div
                key="mobile-sidebar"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="fixed inset-y-0 left-0 z-50 lg:hidden"
                style={{ width: '260px' }}
              >
                <Sidebar mobile profile={profile} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            notificationCount={unreadCount}
            userDisplayName={profile?.displayName ?? profile?.username ?? 'Arc User'}
          />
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: '18px 22px 22px' }}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
