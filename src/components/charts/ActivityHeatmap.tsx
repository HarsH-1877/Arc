'use client';

import { useMemo, useState } from 'react';

interface HeatmapDay {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapDay[];
  loading?: boolean;
  accentColor?: 'blue' | 'purple' | 'cyan';
  compact?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function colorFor(count: number, accent: 'blue' | 'purple' | 'cyan') {
  if (count === 0) return 'var(--bg-elevated)';
  const palettes = {
    blue: ['rgba(79,142,247,0.18)', 'rgba(79,142,247,0.34)', 'rgba(79,142,247,0.52)', 'rgba(79,142,247,0.75)', 'var(--accent-blue)'],
    purple: ['rgba(167,139,250,0.18)', 'rgba(167,139,250,0.34)', 'rgba(167,139,250,0.52)', 'rgba(167,139,250,0.75)', 'var(--accent-purple)'],
    cyan: ['rgba(34,211,238,0.18)', 'rgba(34,211,238,0.34)', 'rgba(34,211,238,0.52)', 'rgba(34,211,238,0.75)', 'var(--accent-cyan)'],
  };
  if (count <= 2) return palettes[accent][0];
  if (count <= 5) return palettes[accent][1];
  if (count <= 9) return palettes[accent][2];
  if (count <= 14) return palettes[accent][3];
  return palettes[accent][4];
}

export function ActivityHeatmap({ data, loading, accentColor = 'blue', compact = false }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (compact ? 244 : 364));
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const weekCount = compact ? 36 : 53;
    const dataMap = new Map(data.map((d) => [d.date, d.count]));
    const builtWeeks: { date: Date; iso: string; count: number }[][] = [];
    const labels: { week: number; endWeek: number; month: string }[] = [];
    let lastMonth = -1;

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex++) {
      const week: { date: Date; iso: string; count: number }[] = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + weekIndex * 7 + dayIndex);
        const iso = date.toISOString().slice(0, 10);
        week.push({ date, iso, count: dataMap.get(iso) ?? 0 });
      }
      const labelDate = week.find((day) => day.date.getDate() === 1)?.date ?? week[0].date;
      const month = labelDate.getMonth();
      if (month !== lastMonth) {
        labels.push({ week: weekIndex, endWeek: weekIndex, month: MONTHS[month] });
        lastMonth = month;
      }
      builtWeeks.push(week);
    }

    const mergedLabels = labels.map((label, index) => ({
      ...label,
      endWeek: (labels[index + 1]?.week ?? weekCount) - 1,
    }));

    return { weeks: builtWeeks, monthLabels: mergedLabels };
  }, [compact, data]);

  if (loading) {
    return (
      <div>
        <div className="skeleton mb-3 h-4 w-32" />
        <div className="skeleton h-24" />
      </div>
    );
  }

  const gap = compact ? 3 : 4;

  return (
    <div className="relative w-full min-w-0 overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: '28px minmax(0, 1fr)', columnGap: 8 }}>
        <span />
        <div className="mb-2 grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`, columnGap: gap }}>
          {monthLabels.map((label) => (
            <span
              key={label.week + label.month}
              className="truncate text-center text-[10px] font-medium"
              style={{
                gridColumn: `${label.week + 1} / ${label.endWeek + 2}`,
                color: 'var(--text-muted)',
              }}
            >
              {label.month}
            </span>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '28px minmax(0, 1fr)', columnGap: 8 }}>
        <div className="grid" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))', rowGap: gap }}>
          {DAY_LABELS.map((label, index) => (
            <span key={index} className="text-[9px] leading-none" style={{ color: 'var(--text-muted)' }}>{label}</span>
          ))}
        </div>
        <div className="grid min-w-0" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`, columnGap: gap }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))', rowGap: gap }}>
              {week.map((day) => (
                <div
                  key={day.iso}
                  className="aspect-square w-full cursor-pointer hover:opacity-80"
                  style={{ borderRadius: 2, background: colorFor(day.count, accentColor), minWidth: 0 }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ x: rect.left, y: rect.top, date: day.iso, count: day.count });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>Less</span>
        {[0, 1, 4, 8, 13].map((count) => (
          <span key={count} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: colorFor(count, accentColor) }} />
        ))}
        <span>More</span>
      </div>

      {tooltip && (
        <div className="fixed z-50 rounded-lg px-3 py-2 text-xs pointer-events-none" style={{ left: tooltip.x - 60, top: tooltip.y - 52, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
          <p className="font-medium">{tooltip.count} {tooltip.count === 1 ? 'problem' : 'problems'} solved</p>
          <p style={{ color: 'var(--text-secondary)' }}>{tooltip.date}</p>
        </div>
      )}
    </div>
  );
}
