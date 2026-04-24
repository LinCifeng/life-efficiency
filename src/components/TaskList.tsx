"use client";

import type { Task } from "@/lib/db";
import { IMEInput } from "@/components/IMEInput";
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
    <ul className="divide-y divide-[color:var(--border-soft)]">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
        >
          <div className="flex items-center gap-3">
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
            <IMEInput
              value={t.title}
              onChange={(v) => patch(t.id, { title: v })}
              placeholder="我选择做……"
              className={clsx(
                "flex-1 bg-transparent py-1 text-[15px] leading-6 outline-none placeholder:text-[color:var(--fg-soft)]",
                t.done && "text-[color:var(--fg-soft)] line-through",
              )}
            />
          </div>
          {(showPlanned || showEstimate) && (
            <div className="ml-8 flex items-center gap-3 text-xs text-[color:var(--fg-muted)]">
              {showPlanned && (
                <SubField label="时间">
                  <IMEInput
                    value={t.plannedAt ?? ""}
                    onChange={(v) => patch(t.id, { plannedAt: v })}
                    placeholder="09:00-11:00"
                    className="w-24 bg-transparent tabular-nums outline-none placeholder:text-[color:var(--fg-soft)]/60"
                  />
                </SubField>
              )}
              {showEstimate && (
                <SubField label="用时">
                  <DurationField
                    value={t.actualMin}
                    onChange={(v) => patch(t.id, { actualMin: v })}
                  />
                </SubField>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function SubField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[color:var(--fg-soft)]">{label}</span>
      {children}
    </div>
  );
}

function DurationField({
  value,
  onChange,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <IMEInput
      value={value != null ? formatMin(value) : ""}
      onChange={(v) => onChange(parseMin(v))}
      placeholder="2小时"
      className="w-20 bg-transparent tabular-nums outline-none placeholder:text-[color:var(--fg-soft)]/60"
    />
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
