/**
 * GitHubContributionGraph.tsx
 *
 * A GitHub-style contribution heatmap built from the public Events API data.
 * Shows the last ~90 days of public activity as a responsive calendar grid.
 * Hovering a cell shows date + event count tooltip.
 *
 * GitHub's full 52-week contribution calendar requires auth; this component
 * uses public push/create/pr events to show real activity without any auth.
 */

import { useState, useMemo } from 'react';
import type { GitHubEvent } from '../../lib/platformServices';
import { cn } from '../../lib/utils';

interface Props {
  events: GitHubEvent[];
  username?: string;
}

function getIntensityClass(count: number): string {
  if (count === 0) return 'gh-cell-0';
  if (count <= 2)  return 'gh-cell-1';
  if (count <= 5)  return 'gh-cell-2';
  if (count <= 9)  return 'gh-cell-3';
  return 'gh-cell-4';
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Build a 13-week (91-day) grid from today going backwards. */
function buildGrid(events: GitHubEvent[]): { date: string; count: number }[][] {
  // Count events per day
  const dayMap: Record<string, number> = {};
  for (const e of events) {
    const day = e.created_at?.slice(0, 10);
    if (day) dayMap[day] = (dayMap[day] ?? 0) + 1;
  }

  // Generate the last 91 days
  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ date: dateStr, count: dayMap[dateStr] ?? 0 });
  }

  // Pad start so first day aligns to its weekday (0=Sun)
  const firstDow = new Date(days[0].date).getDay();
  const padded: { date: string; count: number }[] = [
    ...Array.from({ length: firstDow }, () => ({ date: '', count: -1 })),
    ...days,
  ];

  // Chunk into columns of 7
  const cols: { date: string; count: number }[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    cols.push(padded.slice(i, i + 7));
  }
  return cols;
}

export default function GitHubContributionGraph({ events }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const totalEvents = events.length;
  const grid = useMemo(() => buildGrid(events), [events]);

  // Month labels — find where each month starts
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = '';
    grid.forEach((col, ci) => {
      const firstReal = col.find((c) => c.date && c.count >= 0);
      if (firstReal?.date) {
        const month = new Date(firstReal.date).toLocaleDateString(undefined, { month: 'short' });
        if (month !== lastMonth) {
          labels.push({ col: ci, label: month });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [grid]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-label-secondary">
          {totalEvents} public events in the last 90 days
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-label-tertiary">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className={cn('gh-cell', `gh-cell-${l}`)}
              style={{ width: 11, height: 11 }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Scrollable graph container */}
      <div className="overflow-x-auto pb-2">
        <div className="relative" style={{ minWidth: grid.length * 14 }}>
          {/* Month labels row */}
          <div className="flex mb-1" style={{ paddingLeft: 0 }}>
            {grid.map((_, ci) => {
              const label = monthLabels.find((m) => m.col === ci);
              return (
                <div key={ci} style={{ width: 13, marginRight: 1, flexShrink: 0 }}>
                  {label && (
                    <span className="text-[10px] text-label-tertiary font-medium whitespace-nowrap">
                      {label.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-[1px]">
            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[1px]">
                {col.map((cell, ri) => {
                  if (cell.count < 0) {
                    return <div key={ri} style={{ width: 12, height: 12 }} />;
                  }
                  return (
                    <div
                      key={ri}
                      className={cn('gh-cell rounded-sm transition-all duration-fast', getIntensityClass(cell.count))}
                      style={{ width: 12, height: 12, cursor: cell.date ? 'pointer' : 'default' }}
                      onMouseEnter={(e) => {
                        if (!cell.date) return;
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                          text: `${cell.count} event${cell.count !== 1 ? 's' : ''} on ${formatDateLabel(cell.date)}`,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip portal */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium text-white shadow-lg animate-fade-in"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}

      <p className="text-[11px] text-label-quaternary">
        Based on public GitHub events · Full calendar available after GitHub OAuth
      </p>
    </div>
  );
}
