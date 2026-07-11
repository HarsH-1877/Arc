'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { PlatformBadge } from '@/components/shared/PlatformBadge';
import { PlatformLogo } from '@/components/shared/PlatformLogo';
import { formatRelativeTime } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Code2 } from 'lucide-react';

export interface SubmissionRow {
  id: string;
  problemName: string;
  platform: 'CODEFORCES' | 'LEETCODE';
  verdict: string;
  difficulty?: string | null;
  tags: string[];
  timestamp: string;
}

interface ProblemLogProps {
  submissions: SubmissionRow[];
  loading?: boolean;
}

function VerdictIcon({ verdict }: { verdict: string }) {
  const isAC = verdict === 'OK' || verdict === 'Accepted' || verdict === 'AC';
  const isSkipped = verdict === 'SKIPPED';
  if (isAC) return <CheckCircle2 size={15} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />;
  if (isSkipped) return <MinusCircle size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />;
  return <XCircle size={15} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />;
}

function DifficultyBadge({ difficulty }: { difficulty?: string | null }) {
  if (!difficulty) return null;
  const d = difficulty.toLowerCase();
  const styles: Record<string, { bg: string; text: string }> = {
    easy: { bg: 'var(--accent-green-dim)', text: 'var(--accent-green)' },
    medium: { bg: 'var(--color-warn-dim)', text: 'var(--color-warning)' },
    hard: { bg: 'var(--color-danger-dim)', text: 'var(--color-danger)' },
  };
  const s = styles[d] ?? { bg: 'var(--bg-surface-3)', text: 'var(--text-secondary)' };
  return (
    <span
      className="rounded px-1.5 py-0.5 text-xs font-medium font-mono capitalize"
      style={{ background: s.bg, color: s.text }}
    >
      {difficulty}
    </span>
  );
}

export function ProblemLog({ submissions, loading }: ProblemLogProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'CODEFORCES' | 'LEETCODE'>('ALL');
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | 'AC' | 'WA'>('ALL');

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (platformFilter !== 'ALL' && s.platform !== platformFilter) return false;
      const isAC = s.verdict === 'OK' || s.verdict === 'Accepted' || s.verdict === 'AC';
      if (verdictFilter === 'AC' && !isAC) return false;
      if (verdictFilter === 'WA' && isAC) return false;
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        return s.problemName.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q));
      }
      return true;
    });
  }, [submissions, platformFilter, verdictFilter, globalFilter]);

  const columns = useMemo<ColumnDef<SubmissionRow>[]>(
    () => [
      {
        id: 'verdict',
        cell: ({ row }) => <VerdictIcon verdict={row.original.verdict} />,
        size: 28,
      },
      {
        accessorKey: 'problemName',
        header: 'Problem',
        cell: ({ row }) => (
          <span className="text-sm font-medium truncate block max-w-[220px]" style={{ color: 'var(--text-primary)' }}>
            {row.original.problemName}
          </span>
        ),
      },
      {
        id: 'platform',
        header: 'Platform',
        cell: ({ row }) => <PlatformBadge platform={row.original.platform} />,
        size: 60,
      },
      {
        id: 'difficulty',
        header: 'Difficulty',
        cell: ({ row }) => <DifficultyBadge difficulty={row.original.difficulty} />,
        size: 80,
      },
      {
        id: 'tags',
        header: 'Tags',
        cell: ({ row }) => (
          <div className="flex gap-1 flex-wrap">
            {row.original.tags.slice(0, 2).map((t) => (
              <span key={t} className="rounded px-1.5 py-0.5 text-xs" style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}>
                {t}
              </span>
            ))}
          </div>
        ),
      },
      {
        id: 'time',
        header: 'When',
        cell: ({ row }) => (
          <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
            {formatRelativeTime(row.original.timestamp)}
          </span>
        ),
        size: 100,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-3 mt-4">
        <div className="h-10 w-full rounded-lg bg-[var(--bg-raised)]" />
        <div className="h-10 w-full rounded-lg bg-[var(--bg-raised)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* FIX 7 - Recent Problems Search & Tabs */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search problems or tags..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="interactive-transition focus:outline-none"
          style={{
            width: '100%', maxWidth: '400px', height: '36px',
            background: 'var(--bg-input)', border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-full)', padding: '0 14px',
            fontSize: 'var(--text-sm)', color: 'var(--text-1)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--border-blue)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-base)')}
        />
        
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'CODEFORCES', 'LEETCODE'] as const).map((p) => {
            const active = platformFilter === p;
            return (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className="interactive-transition"
                style={{
                  background: active ? 'var(--blue-dim)' : 'transparent',
                  border: active ? '1px solid var(--border-blue)' : '1px solid var(--border-base)',
                  color: active ? 'var(--blue-bright)' : 'var(--text-2)',
                  fontWeight: active ? 600 : 500,
                  fontSize: 'var(--text-xs)',
                  borderRadius: 'var(--radius-full)',
                  padding: '5px 14px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-blue)'; e.currentTarget.style.color = 'var(--text-1)'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-base)'; e.currentTarget.style.color = 'var(--text-2)'; } }}
              >
                <span className="inline-flex items-center gap-1.5">
                  {p !== 'ALL' && <PlatformLogo platform={p} size={20} />}
                  {p === 'ALL' ? 'All' : p === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'}
                </span>
              </button>
            );
          })}
          {(['ALL', 'AC', 'WA'] as const).map((v) => {
            const active = verdictFilter === v;
            return (
              <button
                key={v}
                onClick={() => setVerdictFilter(v)}
                className="interactive-transition"
                style={{
                  background: active ? 'var(--blue-dim)' : 'transparent',
                  border: active ? '1px solid var(--border-blue)' : '1px solid var(--border-base)',
                  color: active ? 'var(--blue-bright)' : 'var(--text-2)',
                  fontWeight: active ? 600 : 500,
                  fontSize: 'var(--text-xs)',
                  borderRadius: 'var(--radius-full)',
                  padding: '5px 14px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-blue)'; e.currentTarget.style.color = 'var(--text-1)'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-base)'; e.currentTarget.style.color = 'var(--text-2)'; } }}
              >
                {v === 'ALL' ? 'All verdicts' : v}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Code2 size={48} />}
          title="No problems yet"
          description="Link your Codeforces or LeetCode account and sync to see your submissions here."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--border-subtle)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-3)' }}>
                  {table.getHeaderGroups().map((hg) =>
                    hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-2.5 text-left text-xs font-medium"
                        style={{ color: 'var(--text-tertiary)', width: header.getSize() }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: i < table.getRowModel().rows.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-30 transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                <ChevronLeft size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <span className="px-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-30 transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
