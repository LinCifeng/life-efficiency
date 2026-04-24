"use client";

import type { Task } from "@/lib/db";
import clsx from "clsx";

export function TaskList({
  tasks,
  onChange,
  columns,
}: {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
  columns?: { planned?: boolean; estimate?: boolean };
}) {
  const showPlanned = columns?.planned ?? true;
  const showEstimate = columns?.estimate ?? true;

  function patch(id: string, partial: Partial<Task>) {
    onChange(tasks.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  }

  return (
    <div>
      {(showPlanned || showEstimate) && (
        <div className="mb-1.5 flex items-center gap-2 pr-1 text-[11px] text-[color:var(--fg-soft)]">
          <span className="flex-1 pl-8">我选择做</span>
          {showPlanned && <span className="w-24 text-center">时间</span>}
          {showEstimate && <span className="w-16 text-right">预计用时</span>}
        </div>
      )}
      <ul className="space-y-1">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="group flex items-center gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-[color:var(--border-soft)]/40"
          >
            <button
              type="button"
              onClick={() => patch(t.id, { done: !t.done })}
              aria-label={t.done ? "取消完成" : "标记完成"}
              className={clsx(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                t.done
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                  : "border-[color:var(--border)] hover:border-[color:var(--accent-soft)]",
              )}
            >
              {t.done && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4 4 10-10" />
                </svg>
              )}
            </button>
            <input
              type="text"
              value={t.title}
              onChange={(e) => patch(t.id, { title: e.target.value })}
              placeholder="..."
              className={clsx(
                "flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--fg-soft)]",
                t.done && "text-[color:var(--fg-soft)] line-through",
              )}
            />
            {showPlanned && (
              <input
                type="text"
                value={t.plannedAt ?? ""}
                onChange={(e) => patch(t.id, { plannedAt: e.target.value })}
                placeholder="—"
                className="w-24 bg-transparent text-center text-xs tabular-nums text-[color:var(--fg-muted)] outline-none placeholder:text-[color:var(--fg-soft)]/60"
              />
            )}
            {showEstimate && (
              <input
                type="text"
                value={t.actualMin != null ? formatMin(t.actualMin) : ""}
                onChange={(e) => {
                  const v = parseMin(e.target.value);
                  patch(t.id, { actualMin: v });
                }}
                placeholder="—"
                className="w-16 bg-transparent text-right text-xs tabular-nums text-[color:var(--fg-muted)] outline-none placeholder:text-[color:var(--fg-soft)]/60"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatMin(m: number): string {
  if (m >= 60 && m % 60 === 0) return `${m / 60}小时`;
  if (m >= 60) return `${(m / 60).toFixed(1)}小时`;
  return `${m}分钟`;
}

function parseMin(s: string): number | undefined {
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  const hMatch = trimmed.match(/([\d.]+)\s*(小时|h)/i);
  if (hMatch) return Math.round(parseFloat(hMatch[1]) * 60);
  const mMatch = trimmed.match(/([\d.]+)\s*(分钟|m|min)?/i);
  if (mMatch) return Math.round(parseFloat(mMatch[1]));
  return undefined;
}
