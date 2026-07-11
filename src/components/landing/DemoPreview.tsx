import { StatComparison } from '@/components/compare/StatComparison';

const FAKE_USER = {
  id: '1',
  username: 'tourist',
  displayName: 'Gennady Korotkevich',
  avatarUrl: null,
  cfRating: 3821,
  cfRank: 'legendary grandmaster',
  lcRating: 3512,
  totalSolved: 1205,
  streak: 142,
  totalActiveDays: 280,
  lastSyncedAt: null,
  ratingHistory: [],
  topicStats: [],
  heatmapData: [],
};

const FAKE_FRIEND = {
  id: '2',
  username: 'benq',
  displayName: 'Benjamin Qi',
  avatarUrl: null,
  cfRating: 3790,
  cfRank: 'legendary grandmaster',
  lcRating: 3480,
  totalSolved: 1150,
  streak: 89,
  totalActiveDays: 245,
  lastSyncedAt: null,
  ratingHistory: [],
  topicStats: [],
  heatmapData: [],
};

export function DemoPreview() {
  return (
    <section className="py-24 border-t" style={{ background: 'var(--bg-surface-1)', borderColor: 'var(--border-subtle)' }}>
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
          See it in action.
        </h2>
        <p className="text-lg mb-12" style={{ color: 'var(--text-secondary)' }}>
          Live comparison between top competitive programmers.
        </p>

        <div className="mx-auto max-w-4xl text-left pointer-events-none opacity-90 scale-95 sm:scale-100 transition-transform">
          <StatComparison user={FAKE_USER} friend={FAKE_FRIEND} />
        </div>
      </div>
    </section>
  );
}
