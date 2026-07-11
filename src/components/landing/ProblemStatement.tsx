'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ProblemStatement() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.problem-stat', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const stats = [
    { value: '1', label: 'tab for LeetCode' },
    { value: '1', label: 'tab for Codeforces' },
    { value: '0', label: 'unified view' },
  ];

  return (
    <section
      ref={sectionRef}
      className="border-t py-24"
      style={{ background: 'var(--bg-surface-1)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="mx-auto max-w-5xl px-4">
        <p
          className="mb-4 text-center font-mono text-xs uppercase tracking-widest"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {'// The fragmentation problem'}
        </p>
        <h2
          className="mb-16 text-center text-2xl font-semibold sm:text-3xl"
          style={{ color: 'var(--text-primary)' }}
        >
          Your stats are everywhere except together.
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="problem-stat text-center">
              <p className="font-mono text-5xl font-medium" style={{ color: 'var(--accent-primary)' }}>
                {s.value}
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
