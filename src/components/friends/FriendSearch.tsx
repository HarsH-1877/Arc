'use client';

import { useRef, useState } from 'react';
import { Search, UserPlus, Check, Clock } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useFriendSearch, useSendFriendRequest } from '@/hooks/useFriends';
import { useDebounce } from '@/hooks/useDebounce';
import { RatingBadge } from '@/components/shared/RatingBadge';
import { AnimatePresence, motion } from 'framer-motion';
import { useDismissOnOutsideClick } from '@/hooks/useDismissOnOutsideClick';

export function FriendSearch({ placeholder = 'Search by Arc ID...' }: { placeholder?: string }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isLoading } = useFriendSearch(debouncedQuery);
  const { mutate: sendRequest, isPending: isSending } = useSendFriendRequest();
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(searchRef, () => setShowResults(false), showResults);

  const handleSendRequest = (userId: string) => {
    sendRequest(userId, {
      onSuccess: () => {
        setSentTo((prev) => new Set(prev).add(userId));
      },
    });
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="h-10 w-full rounded-lg border pl-10 pr-4 text-sm outline-none transition-colors focus:border-accent-primary"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        />
      </div>

      <AnimatePresence>
      {showResults && query.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
          className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-xl border shadow-xl"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            boxShadow: '0 18px 48px rgba(0,0,0,0.62)',
          }}
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Searching...
            </div>
          ) : results?.length === 0 ? (
            <div className="p-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No users found matching &quot;{query}&quot;
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-2">
              {results?.map((user) => {
                const justSent = sentTo.has(user.id);
                const rel = justSent ? 'PENDING_OUTGOING' : user.relationship;

                return (
                  <li
                    key={user.id}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-[var(--bg-card-hover)]"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <UserAvatar
                        src={user.avatarUrl}
                        name={user.username}
                        size={32}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {user.username}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 ml-2">
                        {user.cfRating != null && <RatingBadge platform="codeforces" rating={user.cfRating} />}
                        {user.lcRating != null && <RatingBadge platform="leetcode" rating={user.lcRating} />}
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-3">
                      {rel === 'FRIEND' ? (
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-green)' }}>
                          <Check size={14} /> Friends
                        </span>
                      ) : rel === 'PENDING_INCOMING' || rel === 'PENDING_OUTGOING' ? (
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          <Clock size={14} /> Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={isSending}
                          className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                          <UserPlus size={14} /> Add
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
