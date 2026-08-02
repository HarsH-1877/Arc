'use client';

import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { useProblemsList, useProblemsStats } from '@/hooks/useProblemsData';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { ChevronLeft, ChevronRight, Activity, Code2, AlertTriangle, Filter } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { ProblemDistributionCard } from '@/components/dashboard/ProblemDistributionCard';
import { useDashboardData } from '@/hooks/useDashboardData';

function TopicWeaknessCard({ topic, accuracy, score, solved }: { topic: string, accuracy: number, score: number, solved: number }) {
  const isDanger = score >= 70;
  const isWarning = score >= 50 && score < 70;
  const color = isDanger ? 'var(--accent-rose)' : isWarning ? 'var(--accent-amber)' : 'var(--accent-green)';
  const strokeDasharray = 126;
  const strokeDashoffset = strokeDasharray - (score / 100) * strokeDasharray;

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <div className="relative mb-2">
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
          <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 24 24)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>
          {score}
        </div>
      </div>
      <p className="text-xs font-semibold text-center mb-1" style={{ color: 'var(--text-primary)' }}>{topic}</p>
      <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{solved} solved • {accuracy}% acc</p>
      <div className="mt-2 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{ background: isDanger ? 'rgba(244,63,94,0.1)' : 'var(--bg-card)', color }}>
        {isDanger ? 'Focus Needed' : 'Needs Practice'}
      </div>
    </div>
  );
}

export function ProblemsClient() {
  const { selectedPlatform } = useUIStore();
  const [platform, setPlatform] = useState<string>('ALL');
  const [verdict, setVerdict] = useState<string>('All');
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useProblemsStats(platform);
  const { data: problems, isLoading: problemsLoading } = useProblemsList({
    platform, verdict, difficulty: 'All', tags: [], lang: 'All', page
  });

  const { data: dashData } = useDashboardData();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Problems</h1>
        <div className="flex gap-2">
          <select value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-md text-sm font-semibold" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}>
            <option value="ALL">All Platforms</option>
            <option value="CODEFORCES">Codeforces</option>
            <option value="LEETCODE">LeetCode</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Problems Solved */}
        <div className="md:col-span-1">
          <ProblemDistributionCard data={dashData} platform={platform === 'ALL' ? selectedPlatform : platform as 'CODEFORCES' | 'LEETCODE'} loading={problemsLoading} />
        </div>

        {/* Accuracy Card */}
        <Card padding="20px" className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Overall Accuracy</h3>
          </div>
          {statsLoading ? <div className="skeleton h-16 w-32" /> : (
            <div className="flex items-end gap-3">
              <span className="font-mono-data text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{stats?.acceptanceRate.toFixed(1)}%</span>
              <div className="flex flex-col mb-1">
                <span className="text-xs font-semibold text-green-400">{stats?.totalAccepted} AC</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {stats?.totalAttempts} attempts</span>
              </div>
            </div>
          )}
        </Card>

        {/* Topic Weakness */}
        <Card padding="20px" className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: 'var(--accent-amber)' }} />
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Topic Weakness</h3>
          </div>
          {statsLoading ? <div className="skeleton h-32 w-full" /> : (
            <div className="grid grid-cols-1 gap-3">
              {stats?.topicWeakness.slice(0, 1).map((w) => (
                <TopicWeaknessCard key={w.topic} {...w} />
              ))}
              {(!stats?.topicWeakness || stats.topicWeakness.length === 0) && (
                <div className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>Not enough data</div>
              )}
            </div>
          )}
        </Card>

        {/* Language Breakdown */}
        <Card padding="20px" className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Code2 size={16} style={{ color: 'var(--accent-purple)' }} />
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Languages</h3>
          </div>
          {statsLoading ? <div className="skeleton h-32 w-full" /> : (
            <div className="flex flex-col gap-3">
              {stats?.languageBreakdown.map((l, i) => {
                const colors = ['var(--accent-purple)', 'var(--accent-blue)', 'var(--accent-cyan)'];
                return (
                  <div key={l.lang} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span style={{ color: 'var(--text-primary)' }}>{l.lang}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{l.count} subs</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(l.count / stats.languageBreakdown[0].count) * 100}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
              {(!stats?.languageBreakdown || stats.languageBreakdown.length === 0) && (
                <div className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>No submissions</div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card padding="0">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Problem Log</h3>
          <select value={verdict} onChange={e => { setVerdict(e.target.value); setPage(1); }} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}>
            <option value="All">All Verdicts</option>
            <option value="AC">Accepted (AC)</option>
            <option value="WA">Others</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b text-[10px] uppercase tracking-wider" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
                <th className="px-5 py-3 font-semibold">Problem</th>
                <th className="px-5 py-3 font-semibold">Verdict</th>
                <th className="px-5 py-3 font-semibold">Tags</th>
                <th className="px-5 py-3 font-semibold text-right">Language</th>
                <th className="px-5 py-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {problemsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-5 py-3"><div className="skeleton h-4 w-48" /></td>
                    <td className="px-5 py-3"><div className="skeleton h-4 w-16" /></td>
                    <td className="px-5 py-3"><div className="skeleton h-4 w-32" /></td>
                    <td className="px-5 py-3"><div className="skeleton h-4 w-12" /></td>
                    <td className="px-5 py-3"><div className="skeleton h-4 w-24" /></td>
                  </tr>
                ))
              ) : problems?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No problems found.</td>
                </tr>
              ) : (
                problems?.items.map((p) => {
                  const isAc = ['OK', 'Accepted', 'AC'].includes(p.verdict);
                  const href = p.platform === 'CODEFORCES' && p.contestId ? `https://codeforces.com/contest/${p.contestId}/problem/${p.externalId.split('-')[1] || 'A'}` : p.problemSlug ? `https://leetcode.com/problems/${p.problemSlug}` : '#';
                  
                  return (
                    <tr key={p.id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <PlatformLogo platform={p.platform} size={16} />
                          <a href={href} target="_blank" rel="noreferrer" className="font-semibold transition-colors hover:text-white" style={{ color: 'var(--text-primary)' }}>
                            {p.problemName}
                          </a>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-1 rounded text-[10px] font-bold tracking-widest" style={{ background: isAc ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)', color: isAc ? 'var(--success)' : 'var(--accent-rose)' }}>
                          {isAc ? 'AC' : 'WA'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.tags.slice(0, 2).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{t}</span>
                          ))}
                          {p.tags.length > 2 && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{p.tags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.language || '-'}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(p.timestamp).toLocaleDateString()}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Showing {problems?.items.length || 0} of {problems?.total || 0}
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1 rounded hover:bg-white/[0.05] disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="text-xs font-semibold px-2">{page}</span>
            <button disabled={!problems || page * 20 >= problems.total} onClick={() => setPage(p => p + 1)} className="p-1 rounded hover:bg-white/[0.05] disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}
