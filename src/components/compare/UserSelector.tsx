'use client';

import { useState, useMemo } from 'react';
import { useFriends } from '@/hooks/useFriends';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { RatingBadge } from '@/components/shared/RatingBadge';
import { ChevronDown, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export function UserSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFriendId = searchParams.get('friend');
  const { data: friends, isLoading } = useFriends();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedFriend = friends?.find((f) => f.id === currentFriendId);

  const filtered = useMemo(() => {
    if (!friends) return [];
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.username.toLowerCase().includes(q) ||
        (f.displayName?.toLowerCase().includes(q) ?? false),
    );
  }, [friends, query]);

  const handleSelect = (id: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/compare?friend=${id}`);
  };

  return (
    <div className="relative w-full max-w-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || friends?.length === 0}
        className="flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors hover:bg-white/[0.02]"
        style={{
          background: 'rgba(20,23,37,0.62)',
          borderColor: 'rgba(255,255,255,0.13)',
          color: 'var(--text-primary)',
          backdropFilter: 'blur(14px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {isLoading ? (
          <span style={{ color: 'var(--text-tertiary)' }}>Loading friends...</span>
        ) : friends?.length === 0 ? (
          <span style={{ color: 'var(--text-tertiary)' }}>No friends to compare</span>
        ) : selectedFriend ? (
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar
              src={selectedFriend.avatarUrl}
              name={selectedFriend.displayName ?? selectedFriend.username}
              size={28}
            />
            <span className="truncate font-medium">
              {selectedFriend.displayName ?? selectedFriend.username}
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>Select a friend...</span>
        )}
        <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border shadow-xl"
            style={{
              background: 'rgba(17,19,29,0.88)',
              borderColor: 'rgba(255,255,255,0.16)',
              boxShadow: '0 18px 48px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.05)',
              backdropFilter: 'blur(18px) saturate(130%)',
            }}
          >
            <div className="border-b p-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search friends..."
                  className="h-8 w-full rounded-md border pl-8 pr-2 text-xs outline-none"
                  style={{
                    background: 'rgba(20,23,37,0.82)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
            <ul className="max-h-60 overflow-y-auto p-1.5">
              {isLoading &&
                [1, 2, 3].map((i) => (
                  <li key={i} className="mb-1 h-10 animate-pulse rounded-lg" style={{ background: 'var(--bg-surface-3)' }} />
                ))}
              {!isLoading &&
                filtered.map((friend) => (
                  <li key={friend.id}>
                    <button
                      onClick={() => handleSelect(friend.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-white/[0.04]"
                      style={{
                        background: friend.id === currentFriendId ? 'var(--accent-blue-dim)' : 'transparent',
                        border: friend.id === currentFriendId ? '1px solid rgba(79,142,247,0.28)' : '1px solid transparent',
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <UserAvatar
                          src={friend.avatarUrl}
                          name={friend.displayName ?? friend.username}
                          size={28}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                            {friend.displayName ?? friend.username}
                          </p>
                          <p className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {friend.cfRating != null && (
                          <RatingBadge platform="codeforces" rating={friend.cfRating} />
                        )}
                        {friend.lcRating != null && (
                          <RatingBadge platform="leetcode" rating={Math.round(friend.lcRating)} />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
            </ul>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </div>
  );
}
