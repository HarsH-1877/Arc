'use client';

import { useMemo, useState, useEffect, useRef } from 'react';

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
  return palettes[accent][4];
}

export function ActivityHeatmap({ data, loading, accentColor = 'blue', compact = false }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const monthsData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    
    const dataMap = new Map(data.map((d) => [d.date, d.count]));
    const builtMonths = [];

    let curr = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    while (curr.getTime() <= endMonth.getTime()) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      
      const mStart = new Date(y, m, 1);
      const mEnd = new Date(y, m + 1, 0);
      
      const weeks = [];
      let currentWeek: ({ iso: string; count: number; date: Date } | null)[] = [];
      
      for (let i = 0; i < mStart.getDay(); i++) {
        currentWeek.push(null);
      }
      
      for (let d = 1; d <= mEnd.getDate(); d++) {
        const dateObj = new Date(y, m, d);
        const dateObjMidnight = dateObj.getTime();
        const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        
        if (dateObjMidnight >= startMidnight && dateObjMidnight <= todayMidnight) {
          const yStr = y.toString();
          const mStr = (m + 1).toString().padStart(2, '0');
          const dStr = d.toString().padStart(2, '0');
          const iso = `${yStr}-${mStr}-${dStr}`;
          
          currentWeek.push({ iso, count: dataMap.get(iso) ?? 0, date: dateObj });
        } else {
          currentWeek.push(null);
        }
        
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }
      
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
      }
      
      builtMonths.push({
        label: MONTHS[m],
        weeks,
        id: `${y}-${m}`
      });
      
      curr.setMonth(curr.getMonth() + 1);
    }

    return builtMonths;
  }, [data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [monthsData]);

  if (loading) {
    return (
      <div>
        <div className="skeleton mb-3 h-4 w-32" />
        <div className="skeleton h-24" />
      </div>
    );
  }

  const cellGap = 3;
  const monthGap = 14;

  return (
    <div className="relative w-full min-w-0 overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: '28px minmax(0, 1fr)', columnGap: 8 }}>
        <div className="grid pt-[20px]" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))', rowGap: cellGap }}>
          {DAY_LABELS.map((label, index) => (
            <span key={index} className="text-[9px] leading-none flex items-center" style={{ color: 'var(--text-muted)' }}>{label}</span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 overflow-x-auto no-scrollbar pb-2" style={{ gap: monthGap }} ref={scrollRef}>
          {monthsData.map((monthData) => (
            <div key={monthData.id} className="flex min-w-0 flex-col" style={{ flex: `0 0 auto`, minWidth: 'max-content' }}>
              <span className="mb-1.5 text-center text-[10px] font-medium" style={{ color: 'var(--text-muted)', lineHeight: '14px' }}>
                {monthData.label}
              </span>
              <div className="flex min-w-0 flex-1" style={{ gap: cellGap }}>
                {monthData.weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid flex-1" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))', rowGap: cellGap }}>
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return (
                          <div
                            key={`empty-${dayIndex}`}
                            className="aspect-square w-3"
                            style={{ background: 'transparent' }}
                          />
                        );
                      }
                      return (
                        <div
                          key={day.iso}
                          className="aspect-square w-3 cursor-pointer hover:opacity-80"
                          style={{ borderRadius: 2, background: colorFor(day.count, accentColor), minWidth: 0 }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({ x: rect.left, y: rect.top, date: day.iso, count: day.count });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>Less</span>
        {[0, 1, 3, 6, 10].map((count) => (
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
