'use client';

import { Suspense, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useCompareData } from '@/hooks/useCompareData';
import { UserSelector } from '@/components/compare/UserSelector';
import { StatComparison } from '@/components/compare/StatComparison';
import { TopicComparison } from '@/components/compare/TopicComparison';
import { ConsistencyComparison } from '@/components/compare/ConsistencyComparison';
import { CompareHeader } from '@/components/compare/CompareHeader';
import { CompareRatingChart } from '@/components/charts/CompareRatingChart';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card } from '@/components/shared/Card';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { GitCompare } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

const TABS = ['Overview', 'Topics', 'Consistency'] as const;
type Tab = (typeof TABS)[number];

function ComparePageContent() {
  const searchParams = useSearchParams();
  const friendId = searchParams.get('friend');
  const reducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const { selectedPlatform } = useUIStore();
  const { data, isLoading, error } = useCompareData(friendId);

  const mergedRatingData = useMemo(() => {
    if (!data) return [];

    const userHistory = (selectedPlatform === 'CODEFORCES'
      ? (data.user.cfRatingHistory?.length ? data.user.cfRatingHistory : data.user.ratingHistory)
      : (data.user.lcRatingHistory?.length ? data.user.lcRatingHistory : data.user.ratingHistory)) ?? [];

    const friendHistory = (selectedPlatform === 'CODEFORCES'
      ? (data.friend.cfRatingHistory?.length ? data.friend.cfRatingHistory : data.friend.ratingHistory)
      : (data.friend.lcRatingHistory?.length ? data.friend.lcRatingHistory : data.friend.ratingHistory)) ?? [];

    if (userHistory.length === 0 && friendHistory.length === 0) return [];

    // Collect all unique dates (normalised to YYYY-MM-DD) from both series
    const allDates = Array.from(
      new Set([
        ...userHistory.map((r) => r.date.slice(0, 10)),
        ...friendHistory.map((r) => r.date.slice(0, 10)),
      ])
    ).sort();

    // Build lookup maps keyed by YYYY-MM-DD
    const userMap = new Map<string, number>();
    for (const r of userHistory) userMap.set(r.date.slice(0, 10), r.rating);

    const friendMap = new Map<string, number>();
    for (const r of friendHistory) friendMap.set(r.date.slice(0, 10), r.rating);

    // Forward-fill: walk dates in order, carry last known rating for each series
    let lastUser: number | undefined;
    let lastFriend: number | undefined;

    return allDates.map((date) => {
      if (userMap.has(date)) lastUser = userMap.get(date);
      if (friendMap.has(date)) lastFriend = friendMap.get(date);

      return {
        date,
        userRating: lastUser,
        friend1: lastFriend,
        friendRating: lastFriend,
      } as { date: string; userRating?: number; friend1?: number; friendRating?: number };
    });
  }, [data, selectedPlatform]);

  const tabTransition = reducedMotion ? { duration: 0 } : { duration: 0.2 };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-4 pb-2">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Compare</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Head-to-head comparison of stats and consistency.</p>
          </div>
          <UserSelector />
        </div>
      </div>

      {!friendId ? (
        <Card padding="32px">
          <EmptyState icon={<GitCompare size={48} />} title="Select a friend" description="Choose a friend from the dropdown above to start comparing stats." />
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          <div className="skeleton h-28" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28" />)}</div>
          <div className="skeleton h-80" />
        </div>
      ) : error ? (
        <Card padding="32px">
          <EmptyState icon={<GitCompare size={48} />} title="Unable to load comparison" description={error.message || 'Something went wrong.'} />
        </Card>
      ) : data ? (
        <div className="space-y-6">
          <CompareHeader user={data.user} friend={data.friend} />
          <StatComparison user={data.user} friend={data.friend} />

          <div className="flex gap-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            {TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className="relative text-sm font-semibold" style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent', paddingBottom: '8px', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
                  {tab}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tabTransition}>
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  <CompareRatingChart data={mergedRatingData} userName={data.user.username} friendName={data.friend.username} />
                </div>
              )}
              {activeTab === 'Topics' && <TopicComparison user={data.user} friend={data.friend} />}
              {activeTab === 'Consistency' && <ConsistencyComparison user={data.user} friend={data.friend} />}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl space-y-6"><div className="skeleton h-40 w-full" /></div>}>
      <ComparePageContent />
    </Suspense>
  );
}
