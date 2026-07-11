'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, GitCompare, Trophy, Flame } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    title: 'Unified Analytics Hub',
    description: "Stop jumping between platforms. View your Codeforces ratings, LeetCode stats, and total problem count in a single, data-dense dashboard.",
    icon: Activity,
    color: 'var(--accent-primary)',
    reverse: false,
  },
  {
    title: 'Head-to-Head Comparison',
    description: "Compare your topic mastery, consistency heatmaps, and rating progression against your friends to find out who's truly the best.",
    icon: GitCompare,
    color: 'var(--accent-cyan)',
    reverse: true,
  },
  {
    title: 'Deep Topic Insights',
    description: "We automatically aggregate your AC submissions to generate a radar chart of your strongest and weakest algorithms.",
    icon: Trophy,
    color: 'var(--accent-green)',
    reverse: false,
  },
  {
    title: 'Global Streak Mechanics',
    description: "A streak is a streak. Solve a problem on either platform and keep your flames alive. Use freeze tokens when life gets in the way.",
    icon: Flame,
    color: 'var(--color-warning)',
    reverse: true,
  },
];

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.feature-row').forEach((row) => {
        gsap.from(row, {
          y: 48,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: row,
            start: 'top 80%',
          },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24" style={{ background: 'var(--bg-base)' }}>
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Built specifically for competitive programmers who value speed, precision, and beautiful data.
          </p>
        </div>

        <div className="space-y-32">
          {FEATURES.map((feature, i) => (
            <div key={i} className={`feature-row flex flex-col gap-12 lg:items-center ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
              <div className="flex-1 space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
                  <feature.icon size={24} style={{ color: feature.color }} />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {feature.title}
                </h3>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {feature.description}
                </p>
              </div>
              <div className="flex-1">
                <div className="relative aspect-square sm:aspect-video lg:aspect-square overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-surface-1)', borderColor: 'var(--border-subtle)' }}>
                  <div className="absolute inset-0 bg-gradient-to-tr opacity-10 blur-2xl" style={{ backgroundImage: `linear-gradient(to top right, ${feature.color}, transparent)` }} />
                  <div className="absolute inset-8 rounded-xl border p-4 shadow-2xl" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)' }}>
                    {/* Abstract feature visualization */}
                    <div className="flex gap-2 mb-4">
                      <div className="h-3 w-3 rounded-full" style={{ background: 'var(--border-subtle)' }} />
                      <div className="h-3 w-3 rounded-full" style={{ background: 'var(--border-subtle)' }} />
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 rounded" style={{ background: 'var(--bg-surface-3)' }} />
                      <div className="h-4 w-1/2 rounded" style={{ background: 'var(--bg-surface-3)' }} />
                      <div className="h-24 w-full rounded mt-6" style={{ background: 'var(--bg-surface-3)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
