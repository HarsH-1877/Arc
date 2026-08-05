'use client';

import { useMemo, useRef, useState } from 'react';
import { ChevronDown, Minus, Plus, Target, Trophy, X } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { AnimatePresence, motion } from 'framer-motion';
import { useDismissOnOutsideClick } from '@/hooks/useDismissOnOutsideClick';

type Platform = 'ALL' | 'CODEFORCES' | 'LEETCODE';
type GoalType = 'rating' | 'questions' | 'rank';

interface RankGoal {
  label: string;
  target: number;
}

const CODEFORCES_RANKS: RankGoal[] = [
  { label: 'Newbie', target: 800 },
  { label: 'Specialist', target: 1400 },
  { label: 'Expert', target: 1600 },
  { label: 'Master', target: 2100 },
  { label: 'Grandmaster', target: 2400 },
  { label: 'Candidate Master', target: 2900 },
  { label: 'Legendary Master', target: 3000 },
];

const LEETCODE_RANKS: RankGoal[] = [
  { label: 'Knight', target: 1850 },
  { label: 'Guardian', target: 2200 },
];

export function GoalSetter({ platform }: { platform: Platform }) {
  const { data } = useDashboardData();
  const [open, setOpen] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>('rating');
  const [customRatingTarget, setCustomRatingTarget] = useState(1800);
  const [questionTarget, setQuestionTarget] = useState(500);
  const [cfRank, setCfRank] = useState(CODEFORCES_RANKS[2]);
  const [lcRank, setLcRank] = useState(LEETCODE_RANKS[0]);
  const [rankOpen, setRankOpen] = useState(false);
  const goalMenuRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(goalMenuRef, () => {
    setOpen(false);
    setRankOpen(false);
  }, open || rankOpen);

  const currentRating = platform === 'CODEFORCES'
    ? data?.platforms.codeforces?.currentRating ?? 0
    : data?.platforms.leetcode?.contestRating ?? 0;
  const currentQuestions = data?.platforms.leetcode?.totalSolved ?? 0;
  const rankGoal = platform === 'CODEFORCES' ? cfRank : lcRank;

  const active = useMemo(() => {
    if (goalType === 'questions') {
      return {
        label: `Solve ${questionTarget} Q's`,
        current: currentQuestions,
        target: questionTarget,
        remainingLabel: 'left',
      };
    }

    if (goalType === 'rank') {
      return {
        label: 'Reach ' + rankGoal.label,
        current: currentRating,
        target: rankGoal.target,
        remainingLabel: 'pts left',
      };
    }

    return {
      label: `Reach ${customRatingTarget}`,
      current: currentRating,
      target: customRatingTarget,
      remainingLabel: 'pts left',
    };
  }, [currentQuestions, currentRating, customRatingTarget, goalType, questionTarget, rankGoal]);

  const remaining = Math.max(0, Math.ceil(active.target - active.current));
  const progress = Math.min(100, Math.round((active.current / Math.max(active.target, 1)) * 100));
  const achieved = remaining === 0;
  const ranks = platform === 'CODEFORCES' ? CODEFORCES_RANKS : LEETCODE_RANKS;

  return (
    <div ref={goalMenuRef} className="relative hidden min-w-[326px] md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 w-full items-center gap-3 rounded-full px-5"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
        }}
      >
        <Target size={18} style={{ color: achieved ? 'var(--success)' : 'var(--brand)' }} />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold">{achieved ? 'Set Goal' : active.label}</span>
            <span className="font-mono-data shrink-0 text-[11px]" style={{ color: achieved ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
              {achieved ? '' : remaining.toLocaleString() + ' ' + active.remainingLabel}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: progress + '%',
                background: achieved ? 'var(--success)' : 'var(--brand)',
              }}
            />
          </div>
        </div>
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.17, ease: [0.4, 0, 0.2, 1] }}
          className="absolute left-0 top-14 z-50 w-[360px] rounded-xl p-4"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={16} style={{ color: 'var(--accent-amber)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Set Goal
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              aria-label="Close goal menu"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'rating' as const, label: 'Rating' },
              { type: 'questions' as const, label: 'Questions' },
              { type: 'rank' as const, label: 'Rank' },
            ].map((item) => {
              const selected = goalType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setGoalType(item.type)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold"
                  style={{
                    background: selected ? 'var(--brand-dim)' : 'var(--bg-card)',
                    border: selected ? '1px solid var(--brand)' : '1px solid var(--border-subtle)',
                    color: selected ? 'var(--brand)' : 'var(--text-secondary)',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {goalType === 'rating' && (
            <GoalInput label="Target rating" value={customRatingTarget} min={800} max={4000} step={50} onChange={setCustomRatingTarget} />
          )}

          {goalType === 'questions' && (
            <GoalInput label="Question target" value={questionTarget} min={1} max={5000} step={25} onChange={setQuestionTarget} />
          )}

          {goalType === 'rank' && (
            <div className="mt-4">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                Target rank
              </label>
              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => setRankOpen((value) => !value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg px-3 text-sm font-semibold"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                >
                  <span>{rankGoal.label}</span>
                  <span className="flex items-center gap-2 font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {rankGoal.target}
                    <ChevronDown size={15} />
                  </span>
                </button>
                <AnimatePresence>
                {rankOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute left-0 right-0 top-12 z-50 rounded-xl p-1.5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: '0 18px 44px rgba(0,0,0,0.54)' }}
                  >
                    {ranks.map((rank) => {
                      const selected = rank.label === rankGoal.label;
                      return (
                        <button
                          key={rank.label}
                          type="button"
                          onClick={() => {
                            if (platform === 'CODEFORCES') setCfRank(rank);
                            else setLcRank(rank);
                            setRankOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold"
                          style={{
                            background: selected ? 'var(--brand-dim)' : 'transparent',
                            color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          <span>{rank.label}</span>
                          <span className="font-mono-data" style={{ color: selected ? 'var(--brand)' : 'var(--text-muted)' }}>{rank.target}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-lg p-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>{achieved ? 'Set Goal' : remaining.toLocaleString() + ' ' + active.remainingLabel}</span>
              <span className="font-mono-data">{Math.round(active.current).toLocaleString()} / {active.target.toLocaleString()}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: progress + '%',
                  background: achieved ? 'var(--success)' : 'var(--brand)',
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function GoalInput({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  const update = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <div className="mt-4">
      <label className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="mt-2 grid grid-cols-[36px_minmax(0,1fr)_36px] overflow-hidden rounded-lg" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
        <button type="button" onClick={() => update(value - step)} className="flex items-center justify-center" style={{ color: 'var(--text-secondary)', borderRight: '1px solid var(--border-subtle)' }} aria-label="Decrease target">
          <Minus size={14} />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => update(Number(event.target.value))}
          className="h-10 w-full px-3 text-center font-mono-data text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          style={{ background: 'transparent', color: 'var(--text-primary)' }}
        />
        <button type="button" onClick={() => update(value + step)} className="flex items-center justify-center" style={{ color: 'var(--text-secondary)', borderLeft: '1px solid var(--border-subtle)' }} aria-label="Increase target">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
