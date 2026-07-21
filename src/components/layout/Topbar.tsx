'use client';

import { Bell, Upload, ChevronDown, Sun, RefreshCw, Menu, Share } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { GoalSetter } from '@/components/layout/GoalSetter';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { AnimatePresence, motion } from 'framer-motion';

interface TopbarProps {
  notificationCount?: number;
  userDisplayName?: string;
}

export function Topbar({ notificationCount = 0 }: TopbarProps) {
  const { toggleMobileSidebar } = useUIStore();
  const { selectedPlatform, setSelectedPlatform } = useUIStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 500);
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setPlatformOpen((value) => !value)}
            className="flex min-w-[140px] items-center justify-between gap-2 rounded-full"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '7px 13px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-2">
              <PlatformLogo platform={selectedPlatform} size={24} active={true} />
              {selectedPlatform === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'}
            </div>
            <ChevronDown size={14} className="opacity-50" />
          </button>
          <AnimatePresence>
          {platformOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -2, scale: 0.99 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              className="absolute right-0 top-[calc(100%+6px)] z-50 w-full rounded-[14px] p-1.5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: '0 18px 48px rgba(0,0,0,0.56)' }}
            >
              {(['CODEFORCES', 'LEETCODE'] as const).filter(item => item !== selectedPlatform).map((item) => (
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
                  <PlatformLogo platform={item} size={22} active={true} />
                  {item === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'}
                </button>
              ))}
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        <button className="relative flex items-center justify-center rounded-full" style={{ width: '32px', height: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }} aria-label={notificationCount + ' unread notifications'}>
          <Bell size={16} />
          {notificationCount > 0 && (
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full" style={{ background: 'var(--danger)' }}>
              <span className="absolute inset-0 rounded-full" style={{ background: 'var(--danger)', animation: 'notificationPulse 1.5s infinite' }} />
            </span>
          )}
        </button>

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
