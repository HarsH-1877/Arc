'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { FriendCard } from '@/components/friends/FriendCard';
import { RequestCard } from '@/components/friends/RequestCard';
import { FriendSearch } from '@/components/friends/FriendSearch';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFriends, useFriendRequests, useRespondToRequest, useUnfriend } from '@/hooks/useFriends';
import { Users, UserPlus } from 'lucide-react';

type SortMode = 'rating' | 'newest' | 'oldest';

function friendSortDate(friend: { id: string; createdAt?: string }) {
  return friend.createdAt ?? friend.id;
}

export default function FriendsPage() {
  const { data: friends, isLoading: isLoadingFriends } = useFriends();
  const { data: requests, isLoading: isLoadingRequests } = useFriendRequests();
  const { mutate: respondToRequest, isPending: isResponding } = useRespondToRequest();
  const { mutate: unfriend, isPending: isUnfriending } = useUnfriend();
  const [sortMode, setSortMode] = useState<SortMode>('rating');

  const handleAccept = (requestId: string) => respondToRequest({ requestId, action: 'ACCEPT' });
  const handleDecline = (requestId: string) => respondToRequest({ requestId, action: 'REJECT' });
  const sortedFriends = useMemo(() => {
    const list = [...(friends ?? [])];
    if (sortMode === 'rating') {
      return list.sort((a, b) => Math.max(b.cfRating ?? 0, b.lcRating ?? 0) - Math.max(a.cfRating ?? 0, a.lcRating ?? 0));
    }
    return list.sort((a, b) => sortMode === 'oldest' ? friendSortDate(a).localeCompare(friendSortDate(b)) : friendSortDate(b).localeCompare(friendSortDate(a)));
  }, [friends, sortMode]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Friends</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Connect with others to compare stats and track progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              All Friends {friends && <span style={{ color: 'var(--text-muted)' }}>({friends.length})</span>}
            </h2>
            <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
              <div className="flex rounded-full p-1" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
                {[
                  { value: 'rating' as const, label: 'Rating' },
                  { value: 'newest' as const, label: 'Newest' },
                  { value: 'oldest' as const, label: 'Oldest' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSortMode(item.value)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: sortMode === item.value ? 'var(--brand-dim)' : 'transparent',
                      color: sortMode === item.value ? 'var(--brand)' : 'var(--text-secondary)',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoadingFriends ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[74px]" />)}
            </div>
          ) : friends?.length === 0 ? (
            <Card padding="32px">
              <EmptyState icon={<Users size={64} />} title="No friends yet" description="Search for users above to send friend requests." />
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedFriends.map((friend, index) => <FriendCard key={friend.id} friend={friend} rank={index + 1} onUnfriend={unfriend} isUnfriending={isUnfriending} />)}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="relative z-20">
            <FriendSearch placeholder="Add friends" />
          </div>
          <Card padding="18px" className="gap-4" variant="base">
            <div className="absolute inset-0 rounded-[var(--r-lg)]" style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(167,139,250,0.04))', border: '1px solid rgba(79,142,247,0.16)', pointerEvents: 'none' }} />
            <h2 className="relative z-10 text-sm font-semibold" style={{ color: 'var(--brand)' }}>
              Requests ({requests?.length ?? 0})
            </h2>

            {isLoadingRequests ? (
              <div className="relative z-10 space-y-3">
                {[1, 2].map((i) => <div key={i} className="skeleton h-16" />)}
              </div>
            ) : requests?.length === 0 ? (
              <div className="relative z-10 flex flex-col items-center justify-center rounded-lg py-12 text-center" style={{ border: '1px dashed var(--border-default)' }}>
                <UserPlus size={40} className="mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No pending requests</p>
              </div>
            ) : (
              <div className="relative z-10 space-y-3">
                {requests?.map((req) => <RequestCard key={req.id} request={req} onAccept={req.type === 'INCOMING' ? handleAccept : undefined} onDecline={handleDecline} isProcessing={isResponding} />)}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
