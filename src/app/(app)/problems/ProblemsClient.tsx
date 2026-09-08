'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/shared/Card';
import { useProblemsList, useProblemsStats, TopicWeaknessItem } from '@/hooks/useProblemsData';
import { useDashboardData } from '@/hooks/useDashboardData';
import { ProblemDistributionCard } from '@/components/dashboard/ProblemDistributionCard';
import { getCodeforcesProblemUrl } from '@/lib/codeforces/problem-url';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { useUIStore } from '@/store/useUIStore';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Activity,
  Code2,
  AlertTriangle,
  Filter,
  Search,
  Info,
  TrendingUp,
  Target,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
} from 'lucide-react';

const TAG_OPTIONS = [
  'All Tags',
  'Graph Theory',
  'Dynamic Programming',
  'Data Structures',
  'Trees',
  'Math',
  'Greedy',
  'Strings',
  'Two Pointers',
  'Binary Search',
  'Sorting',
  'DFS/BFS',
  'Arrays',
  'Recursion',
  'Bit Manipulation',
];

const LANGUAGE_OPTIONS = [
  'All Languages',
  'C++',
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'Rust',
  'Go',
];

function CircularGauge({ score, color }: { score: number; color: string }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-11 h-11">
      <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="3.5"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-extrabold leading-none font-mono-data" style={{ color: 'var(--text-primary)' }}>
          {score}
        </span>
        <span className="text-[7px] font-semibold text-[var(--text-muted)] leading-none mt-0.5">
          /100
        </span>
      </div>
    </div>
  );
}

function TopicWeaknessSection({
  items,
  loading,
}: {
  items?: TopicWeaknessItem[];
  loading: boolean;
}) {
  const list = items && items.length > 0 ? items : [];

  const rankConfig = [
    {
      badgeBg: 'rgba(239, 68, 68, 0.12)',
      badgeText: '#ef4444',
      badgeBorder: 'rgba(239, 68, 68, 0.25)',
      iconBg: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.3) 100%)',
      iconBorder: 'rgba(239,68,68,0.4)',
      gaugeColor: '#ef4444',
    },
    {
      badgeBg: 'rgba(249, 115, 22, 0.12)',
      badgeText: '#f97316',
      badgeBorder: 'rgba(249, 115, 22, 0.25)',
      iconBg: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(234,88,12,0.3) 100%)',
      iconBorder: 'rgba(249,115,22,0.4)',
      gaugeColor: '#f97316',
    },
    {
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      badgeText: '#f59e0b',
      badgeBorder: 'rgba(245, 158, 11, 0.25)',
      iconBg: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.3) 100%)',
      iconBorder: 'rgba(245,158,11,0.4)',
      gaugeColor: '#f59e0b',
    },
  ];

  return (
    <Card padding="20px" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)] gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Topic Weakness (Top 3)
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2.5 py-1 rounded-md border border-[var(--border-subtle)]">
          <Info size={14} className="shrink-0 text-amber-400" />
          <span>Based on accuracy and questions solved</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 py-2">
          <div className="skeleton h-16 w-full rounded-xl" />
          <div className="skeleton h-16 w-full rounded-xl" />
          <div className="skeleton h-16 w-full rounded-xl" />
        </div>
      ) : list.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Not enough data yet. Solve more problems to see your weak topics.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {list.slice(0, 3).map((item, idx) => {
            const config = rankConfig[idx % rankConfig.length];
            return (
              <div
                key={item.topic}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)] transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm"
                    style={{
                      background: config.iconBg,
                      border: `1px solid ${config.iconBorder}`,
                      color: config.badgeText,
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                        {item.topic}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-medium">
                        Solved: {item.solved}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span
                        className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border"
                        style={{
                          background: config.badgeBg,
                          color: config.badgeText,
                          borderColor: config.badgeBorder,
                        }}
                      >
                        {item.recommendation}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-black font-mono-data text-[var(--text-primary)]">
                      {item.accuracy}%
                    </div>
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-muted)]">
                      Accuracy
                    </div>
                  </div>
                  <CircularGauge score={item.score} color={config.gaugeColor} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-1.5 font-medium">
        <Info size={13} className="shrink-0" />
        <span>Score is calculated considering low accuracy and attempts</span>
      </div>
    </Card>
  );
}

export function ProblemsClient() {
  const [platform, setPlatform] = useState<string>('ALL');
  const [verdict, setVerdict] = useState<string>('All');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [difficultyMin, setDifficultyMin] = useState<number>(800);
  const [difficultyMax, setDifficultyMax] = useState<number>(3500);
  const [tag, setTag] = useState<string>('All Tags');
  const [lang, setLang] = useState<string>('All Languages');
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const selectedTags = useMemo(() => (tag !== 'All Tags' ? [tag] : []), [tag]);

  // Derive the difficulty param to send to the API
  // CF: convert slider range to a filter string; LC/ALL: use pill value
  const apiDifficulty = useMemo(() => {
    if (platform === 'CODEFORCES') {
      if (difficultyMin <= 800 && difficultyMax >= 3500) return 'All';
      return `${difficultyMin}-${difficultyMax}`;
    }
    // For LC and ALL, map Easy/Med/Hard labels
    return difficulty;
  }, [platform, difficulty, difficultyMin, difficultyMax]);

  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData();
  const { data: stats, isLoading: statsLoading } = useProblemsStats(platform);
  const { data: problems, isLoading: problemsLoading } = useProblemsList({
    platform,
    verdict,
    difficulty: apiDifficulty,
    tags: selectedTags,
    lang,
    search,
    sort,
    page,
    pageSize,
  });

  const resetFilters = () => {
    setPlatform('ALL');
    setVerdict('All');
    setDifficulty('All');
    setDifficultyMin(800);
    setDifficultyMax(3500);
    setTag('All Tags');
    setLang('All Languages');
    setSearch('');
    setSort('newest');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil((problems?.total || 0) / pageSize));

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Top 4 Stats Cards Row - sleek compact height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {/* Card 1: Total Solved (Pie Chart for LC, Histogram for CF, Solved Count for ALL) */}
        <ProblemDistributionCard
          data={dashboardData}
          platform={platform as any}
          loading={dashboardLoading}
        />

        {/* Card 2: Accuracy */}
        <Card padding="12px 16px" className="flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Accuracy</span>
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)' }}>
              <Activity size={14} style={{ color: 'var(--accent-blue)' }} />
            </div>
          </div>
          {statsLoading ? (
            <div className="skeleton h-9 w-24 my-1" />
          ) : (
            <div className="font-mono-data text-3xl sm:text-4xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
              {(stats?.accuracy ?? stats?.acceptanceRate ?? 0).toFixed(1)}%
            </div>
          )}
          <div className="flex items-center gap-1 mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <TrendingUp size={11} />
            <span>{stats?.accuracyTrend ?? 'Submission rate'}</span>
          </div>
        </Card>

        {/* Card 3: Topic Weakness */}
        <Card padding="12px 14px" className="flex flex-col min-h-[100px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Topic Weakness</span>
            <div className="p-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle size={13} style={{ color: 'var(--accent-amber)' }} />
            </div>
          </div>
          {statsLoading ? (
            <div className="space-y-1.5 flex-1">
              {[0,1,2].map(i => <div key={i} className="skeleton h-6 w-full rounded" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
              {(stats?.topicWeakness?.slice(0, 3) ?? []).map((item, idx) => {
                const colors = [
                  { gauge: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
                  { gauge: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', text: '#f97316' },
                  { gauge: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
                ];
                const c = colors[idx % 3];
                return (
                  <div key={item.topic} className="flex items-center gap-2 rounded-md px-2 py-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>#{idx+1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.topic}</p>
                    </div>
                    <span className="font-mono-data text-[11px] font-bold" style={{ color: c.text }}>{item.accuracy}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Card 4: Language Distribution */}
        <Card padding="12px 14px" className="flex flex-col min-h-[100px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Language Distribution</span>
            <div className="p-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Code2 size={13} style={{ color: 'var(--accent-purple)' }} />
            </div>
          </div>
          {statsLoading ? (
            <div className="space-y-1.5 flex-1">
              {[0,1,2].map(i => <div key={i} className="skeleton h-5 w-full rounded" />)}
            </div>
          ) : (() => {
            const langs = stats?.languageBreakdown ?? [];
            const total = langs.reduce((s, l) => s + l.count, 0) || 1;
            return (
              <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
                {langs.slice(0, 3).map((l) => (
                  <div key={l.lang}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{l.lang}</span>
                      <span className="text-[10px] font-mono-data" style={{ color: 'var(--text-muted)' }}>{((l.count / total) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: 'var(--border-subtle)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(l.count / total) * 100}%`, background: 'var(--accent-purple)' }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>
      </div>

      {/* 2. Problem List & Filters Card */}
      <Card padding="0" className="overflow-hidden">
        {/* Filters Bar Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 flex flex-col gap-3.5">
          {/* Row 1: Search + Platform Pills + Difficulty Filter + Reset Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1 min-w-[240px] max-w-[413px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search problem title or contest..."
                className="w-full pl-9 pr-3 h-9 rounded-lg text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Platform Filter Pills — logos only */}
              <div
                className="flex items-center bg-[var(--bg-input)] p-1 rounded-lg gap-0.5 h-9"
                style={{
                  border: platform === 'CODEFORCES'
                    ? '1px solid rgba(30,136,229,0.55)'
                    : platform === 'LEETCODE'
                    ? '1px solid rgba(255,161,22,0.55)'
                    : '1px solid var(--border-default)',
                }}
              >
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'CODEFORCES', label: 'Codeforces' },
                  { id: 'LEETCODE', label: 'LeetCode' },
                ].map((p) => {
                  const isActive = platform === p.id;
                  const activeColor = p.id === 'CODEFORCES'
                    ? 'rgba(30,136,229,0.18)'
                    : p.id === 'LEETCODE'
                    ? 'rgba(255,161,22,0.18)'
                    : 'rgba(255,255,255,0.10)';
                  const activeBorder = p.id === 'CODEFORCES'
                    ? '1px solid rgba(30,136,229,0.45)'
                    : p.id === 'LEETCODE'
                    ? '1px solid rgba(255,161,22,0.45)'
                    : '1px solid rgba(255,255,255,0.2)';
                  const activeText = p.id === 'CODEFORCES'
                    ? '#4f8ef7'
                    : p.id === 'LEETCODE'
                    ? '#ffa116'
                    : 'var(--text-primary)';
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setPlatform(p.id); setDifficultyMin(800); setDifficultyMax(3500); setDifficulty('All'); setPage(1); }}
                      title={p.label}
                      className="flex items-center justify-center px-2.5 h-7 rounded-md transition-all"
                      style={{
                        background: isActive ? activeColor : 'transparent',
                        border: isActive ? activeBorder : '1px solid transparent',
                        color: isActive ? activeText : 'var(--text-secondary)',
                      }}
                    >
                      {p.id !== 'ALL' ? (
                        <PlatformLogo platform={p.id as 'CODEFORCES' | 'LEETCODE'} size={16} active={isActive} />
                      ) : (
                        <span className="text-[11px] font-bold">All</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reset Filters Button */}
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold bg-[var(--bg-elevated)] hover:bg-white/10 text-[var(--text-secondary)] border border-[var(--border-default)] transition-colors shrink-0"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Row 2: Secondary Dropdowns (Tag, Status, Language, Sort) + Difficulty Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Tags Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Tag</span>
              <div className="relative">
                <select
                  value={tag}
                  onChange={(e) => { setTag(e.target.value); setPage(1); }}
                  className="h-8 appearance-none cursor-pointer pl-3 pr-8 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: tag !== 'All Tags' ? 'rgba(79,142,247,0.12)' : 'var(--bg-elevated)',
                    color: tag !== 'All Tags' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    border: tag !== 'All Tags' ? '1px solid rgba(79,142,247,0.35)' : '1px solid var(--border-default)',
                    minWidth: '120px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  {TAG_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: tag !== 'All Tags' ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Status</span>
              <div className="relative">
                <select
                  value={verdict}
                  onChange={(e) => { setVerdict(e.target.value); setPage(1); }}
                  className="h-8 appearance-none cursor-pointer pl-3 pr-8 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: verdict === 'AC' ? 'rgba(52,211,153,0.12)' : verdict === 'ATTEMPTED' ? 'rgba(251,191,36,0.12)' : verdict === 'WA' ? 'rgba(244,63,94,0.12)' : 'var(--bg-elevated)',
                    color: verdict === 'AC' ? 'var(--accent-green)' : verdict === 'ATTEMPTED' ? 'var(--accent-amber)' : verdict === 'WA' ? 'var(--accent-rose)' : 'var(--text-secondary)',
                    border: verdict === 'AC' ? '1px solid rgba(52,211,153,0.35)' : verdict === 'ATTEMPTED' ? '1px solid rgba(251,191,36,0.35)' : verdict === 'WA' ? '1px solid rgba(244,63,94,0.35)' : '1px solid var(--border-default)',
                    minWidth: '120px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="AC">Accepted (AC)</option>
                  <option value="ATTEMPTED">Attempted</option>
                  <option value="WA">Wrong Answer (WA)</option>
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: verdict !== 'All' ? 'currentColor' : 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Language Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Lang</span>
              <div className="relative">
                <select
                  value={lang}
                  onChange={(e) => { setLang(e.target.value); setPage(1); }}
                  className="h-8 appearance-none cursor-pointer pl-3 pr-8 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: lang !== 'All Languages' ? 'rgba(139,92,246,0.12)' : 'var(--bg-elevated)',
                    color: lang !== 'All Languages' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    border: lang !== 'All Languages' ? '1px solid rgba(139,92,246,0.35)' : '1px solid var(--border-default)',
                    minWidth: '120px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: lang !== 'All Languages' ? 'var(--accent-purple)' : 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sort</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="h-8 appearance-none cursor-pointer pl-3 pr-8 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: sort !== 'newest' ? 'rgba(79,142,247,0.10)' : 'var(--bg-elevated)',
                    color: sort !== 'newest' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    border: sort !== 'newest' ? '1px solid rgba(79,142,247,0.30)' : '1px solid var(--border-default)',
                    minWidth: '130px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="difficulty_asc">Easy → Hard</option>
                  <option value="difficulty_desc">Hard → Easy</option>
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: sort !== 'newest' ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Dynamic Difficulty Filter — slider for CF, pills for LC/All — pushed to far right */}
            <div className="ml-auto">
              {platform === 'CODEFORCES' ? (
                <div className="flex flex-col justify-center gap-0.5 bg-[var(--bg-input)] px-3 h-9 rounded-lg border border-[var(--border-default)] min-w-[209px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Rating</span>
                    <span className="text-[11px] font-bold font-mono-data" style={{ color: '#4f8ef7' }}>
                      {difficultyMin === 800 && difficultyMax === 3500 ? 'All' : `${difficultyMin}–${difficultyMax}`}
                    </span>
                  </div>
                  <div className="relative h-3 flex items-center">
                    <div className="absolute h-1 w-full rounded-full" style={{ background: 'var(--border-subtle)' }} />
                    <div
                      className="absolute h-1 rounded-full"
                      style={{
                        background: '#4f8ef7',
                        left: `${((difficultyMin - 800) / (3500 - 800)) * 100}%`,
                        right: `${100 - ((difficultyMax - 800) / (3500 - 800)) * 100}%`,
                      }}
                    />
                    <div
                      className="absolute w-3 h-3 rounded-full border-2 shadow-md pointer-events-none z-10"
                      style={{
                        left: `calc(${((difficultyMin - 800) / (3500 - 800)) * 100}% - 6px)`,
                        background: '#4f8ef7',
                        borderColor: 'var(--bg-card)',
                      }}
                    />
                    <div
                      className="absolute w-3 h-3 rounded-full border-2 shadow-md pointer-events-none z-10"
                      style={{
                        left: `calc(${((difficultyMax - 800) / (3500 - 800)) * 100}% - 6px)`,
                        background: '#4f8ef7',
                        borderColor: 'var(--bg-card)',
                      }}
                    />
                    <input
                      type="range" min={800} max={3500} step={100}
                      value={difficultyMin}
                      onChange={(e) => { const v = Math.min(Number(e.target.value), difficultyMax - 100); setDifficultyMin(v); setPage(1); }}
                      className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                      style={{ zIndex: difficultyMin > 2000 ? 5 : 4 }}
                    />
                    <input
                      type="range" min={800} max={3500} step={100}
                      value={difficultyMax}
                      onChange={(e) => { const v = Math.max(Number(e.target.value), difficultyMin + 100); setDifficultyMax(v); setPage(1); }}
                      className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                      style={{ zIndex: difficultyMin > 2000 ? 4 : 5 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-default)] h-9">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] px-2">Difficulty:</span>
                  {['All', 'Easy', 'Medium', 'Hard'].map((d) => {
                    const isActive = difficulty === d;
                    const activeColor = d === 'Easy' ? 'rgba(52,211,153,0.15)' : d === 'Medium' ? 'rgba(251,191,36,0.15)' : d === 'Hard' ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.10)';
                    const activeBorder = d === 'Easy' ? '1px solid rgba(52,211,153,0.4)' : d === 'Medium' ? '1px solid rgba(251,191,36,0.4)' : d === 'Hard' ? '1px solid rgba(244,63,94,0.4)' : '1px solid rgba(255,255,255,0.2)';
                    const activeText = d === 'Easy' ? 'var(--accent-green)' : d === 'Medium' ? 'var(--accent-amber)' : d === 'Hard' ? 'var(--danger)' : 'var(--text-primary)';
                    return (
                      <button
                        key={d}
                        onClick={() => { setDifficulty(d); setPage(1); }}
                        className="px-2.5 h-7 rounded-md text-xs font-semibold transition-all"
                        style={{
                          background: isActive ? activeColor : 'transparent',
                          border: isActive ? activeBorder : '1px solid transparent',
                          color: isActive ? activeText : 'var(--text-secondary)',
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Problem Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider font-semibold text-[var(--text-muted)] bg-[var(--bg-elevated)]" style={{ borderColor: 'var(--border-subtle)' }}>
                <th className="px-5 py-3">Problem</th>
                <th className="px-5 py-3 text-center">Platform</th>
                <th className="px-5 py-3 text-center">Difficulty</th>
                <th className="px-5 py-3 text-center">Solved On</th>
                <th className="px-5 py-3 text-center">Language</th>
                <th className="px-5 py-3">Tags</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[var(--border-subtle)]">
              {problemsLoading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="hover:bg-white/[0.01]">
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-48" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-16" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-16" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-28" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-16" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-24" /></td>
                    <td className="px-5 py-3.5 text-center"><div className="skeleton h-5 w-5 mx-auto rounded-full" /></td>
                  </tr>
                ))
              ) : problems?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-[var(--text-muted)]">
                    No problems match the selected filters.
                  </td>
                </tr>
              ) : (
                problems?.items.map((p) => {
                  const isAc = ['OK', 'Accepted', 'AC'].includes(p.verdict);
                  // Attempted = submitted but not accepted (has WA/TLE/MLE/RE — tried at least once)
                  const isAttempted = !isAc && ['WA', 'TLE', 'MLE', 'RE', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'PARTIAL'].some(v => p.verdict.toUpperCase().includes(v.toUpperCase()));
                  const href =
                    p.platform === 'CODEFORCES' && p.contestId
                      ? (getCodeforcesProblemUrl(p.contestId, p.problemSlug) ?? `https://codeforces.com/contest/${p.contestId}`)
                      : p.problemSlug
                      ? `https://leetcode.com/problems/${p.problemSlug}`
                      : '#';

                  const diffUpper = (p.difficulty || 'Medium').toUpperCase();
                  const isEasy = diffUpper === 'EASY' || diffUpper === '800' || diffUpper === '900' || diffUpper === '1000';
                  const isHard = diffUpper === 'HARD' || parseInt(diffUpper) >= 1900;
                  const diffColorClass = isEasy
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : isHard
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                  const formattedDate = new Date(p.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Column 1: Problem Title + Contest */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[var(--text-primary)] hover:text-purple-400 transition-colors inline-block"
                          >
                            {p.problemName}
                          </a>
                          {p.contestName && (
                            <span className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
                              {p.contestName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Platform - logo only */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <PlatformLogo platform={p.platform} size={20} />
                        </div>
                      </td>

                      {/* Column 3: Difficulty */}
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${diffColorClass}`}
                        >
                          {p.difficulty || 'Medium'}
                        </span>
                      </td>

                      {/* Column 4: Solved On */}
                      <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)] whitespace-nowrap text-center">
                        {formattedDate}
                      </td>

                      {/* Column 5: Language */}
                      <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)] font-medium text-center">
                        {p.language || 'C++17'}
                      </td>

                      {/* Column 7: Tags */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {p.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                            >
                              {t}
                            </span>
                          ))}
                          {p.tags.length > 2 && (
                            <span className="text-[10px] font-semibold text-[var(--text-muted)] self-center px-1">
                              +{p.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 8: Status */}
                      <td className="px-5 py-3.5 text-center">
                        {isAc ? (
                          <div className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-500/10 text-emerald-400" title="Accepted">
                            <CheckCircle2 size={18} />
                          </div>
                        ) : isAttempted ? (
                          <div className="inline-flex items-center justify-center p-1 rounded-full bg-amber-500/10 text-amber-400" title="Attempted (not accepted)">
                            <MinusCircle size={18} />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center p-1 rounded-full bg-rose-500/10 text-rose-400" title="Wrong Answer / Error">
                            <XCircle size={18} />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 gap-3">
          <span className="text-xs text-[var(--text-muted)] font-medium">
            Showing {problems?.items.length ? (page - 1) * pageSize + 1 : 0} -{' '}
            {Math.min(page * pageSize, problems?.total || 0)} of {problems?.total || 0} problems
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1 || problemsLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-input)] hover:bg-white/10 text-[var(--text-primary)] border border-[var(--border-default)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pNum = page - 2 + i;
              if (page <= 3) pNum = i + 1;
              if (pNum > totalPages || pNum < 1) return null;

              return (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === pNum
                      ? 'text-white shadow-sm'
                      : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 border border-[var(--border-default)]'
                  }`}
                  style={page === pNum ? { background: 'var(--accent-blue)' } : undefined}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              disabled={!problems || page >= totalPages || problemsLoading}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-input)] hover:bg-white/10 text-[var(--text-primary)] border border-[var(--border-default)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
