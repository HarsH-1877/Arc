'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_STEPS = ['Account', 'Credentials', 'Link handles'];

export function AuthStepper({ current = 0, steps = DEFAULT_STEPS }: { current?: number; steps?: string[] }) {
  return (
    <div className="mb-7 w-full">
      <div className="flex items-center">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;

          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold',
                    done && 'border-[rgba(52,199,123,0.45)] bg-[rgba(52,199,123,0.12)] text-[var(--accent-green)]',
                    active && 'border-[rgba(79,110,247,0.65)] bg-[rgba(79,110,247,0.14)] text-[var(--accent-blue)] shadow-[0_0_18px_rgba(79,110,247,0.18)]',
                    !done && !active && 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]',
                  )}
                >
                  {done ? <Check size={13} /> : index + 1}
                </span>
                <span
                  className={cn(
                    'hidden font-mono text-[10px] uppercase tracking-[0.14em] sm:inline',
                    active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
                  )}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-3 h-px flex-1',
                    index < current ? 'bg-[rgba(52,199,123,0.45)]' : 'bg-[var(--border-subtle)]',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
