"use client";

import type { Task } from "@/lib/db";
import { IMEInput } from "@/components/IMEInput";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export function TaskList({
  tasks,
  onChange,
  showEstimate = true,
  draggable = true,
  onEnter,
}: {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
  showEstimate?: boolean;
  draggable?: boolean;
  /** 任务标题输入框按回车时触发，参数为当前任务 id。 */
  onEnter?: (taskId: string) => void;
}) {
  function patch(id: string, partial: Partial<Task>) {
    onChange(tasks.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-[color:var(--border-soft)]">
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          showEstimate={showEstimate}
          draggable={draggable}
          onPatch={(p) => patch(t.id, p)}
          onEnter={onEnter ? () => onEnter(t.id) : undefined}
        />
      ))}
    </ul>
  );
}

function TaskRow({
  task,
  showEstimate,
  draggable,
  onPatch,
  onEnter,
}: {
  task: Task;
  showEstimate: boolean;
  draggable: boolean;
  onPatch: (p: Partial<Task>) => void;
  onEnter?: () => void;
}) {
  const sortable = useSortable({ id: task.id, disabled: !draggable });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const style: React.CSSProperties = draggable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }
    : {};

  return (
    <li
      ref={draggable ? setNodeRef : undefined}
      style={style}
      className="group flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
    >
      <div className="flex items-center gap-2">
        {draggable && (
          <button
            type="button"
            aria-label="拖动排序"
            {...attributes}
            {...listeners}
            className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-[color:var(--fg-soft)] opacity-40 transition-opacity hover:text-[color:var(--fg-muted)] group-hover:opacity-100 active:cursor-grabbing"
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="2" cy="2" r="1.2" />
              <circle cx="8" cy="2" r="1.2" />
              <circle cx="2" cy="7" r="1.2" />
              <circle cx="8" cy="7" r="1.2" />
              <circle cx="2" cy="12" r="1.2" />
              <circle cx="8" cy="12" r="1.2" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={() => onPatch({ done: !task.done })}
          aria-label={task.done ? "取消完成" : "标记完成"}
          className={clsx(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
            task.done
              ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
              : "border-[color:var(--border)] hover:border-[color:var(--accent-soft)]",
          )}
        >
          {task.done && (
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
          value={task.title}
          onChange={(v) => onPatch({ title: v })}
          onEnter={onEnter}
          data-task-id={task.id}
          placeholder="我选择做……"
          className={clsx(
            "flex-1 bg-transparent py-1 text-[15px] leading-6 outline-none placeholder:text-[color:var(--fg-soft)]",
            task.done && "text-[color:var(--fg-soft)] line-through",
          )}
        />
        {showEstimate && (
          <DurationField
            value={task.actualMin}
            onChange={(v) => onPatch({ actualMin: v })}
          />
        )}
      </div>
    </li>
  );
}

/**
 * 用时输入：以小时为单位，0.5h 步进。
 * 支持输入 "1"、"1.5"、"1h30m"、"90"（默认当分钟）。
 * 失焦后会规范化为 "1 小时 30 分钟" 的友好格式。
 */
function DurationField({
  value,
  onChange,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value != null ? String(value / 60) : "");
  }, [value, editing]);

  function commit(s: string) {
    const parsed = parseDuration(s);
    onChange(parsed);
  }

  /**
   * 增/减 0.5h。优先以当前 draft（用户正在输入的中间值）为准，
   * 其次用 value。这样点按钮时体验连贯，不会被 input 未提交的值覆盖。
   */
  function step(delta: number) {
    const parsedDraft = parseDuration(draft);
    const cur =
      parsedDraft != null
        ? parsedDraft / 60
        : value != null
        ? value / 60
        : 0;
    const next = Math.max(0, Math.round((cur + delta) * 2) / 2);
    const nextMin = next === 0 ? undefined : next * 60;
    setDraft(next === 0 ? "" : String(next));
    onChange(nextMin);
  }

  if (!editing) {
    // 静态展示
    return (
      <button
        type="button"
        onClick={() => {
          setEditing(true);
          queueMicrotask(() => inputRef.current?.focus());
        }}
        className={clsx(
          "shrink-0 rounded-md border border-transparent px-2 py-0.5 text-[11px] tabular-nums transition-colors hover:border-[color:var(--border)]",
          value != null
            ? "text-[color:var(--fg-muted)]"
            : "text-[color:var(--fg-soft)]",
        )}
        title="用时"
      >
        {value != null ? formatDuration(value) : "＋ 用时"}
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-[color:var(--accent-soft)] bg-[color:var(--bg-card)] px-1">
      <button
        type="button"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => step(-0.5)}
        aria-label="减少 0.5 小时"
        className="h-6 w-6 rounded text-[color:var(--fg-muted)] hover:bg-[color:var(--border-soft)] hover:text-[color:var(--fg)]"
      >
        −
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        placeholder="小时"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
            setEditing(false);
          } else if (e.key === "Escape") {
            setEditing(false);
            setDraft(value != null ? String(value / 60) : "");
          }
        }}
        onBlur={() => {
          commit(draft);
          setEditing(false);
        }}
        className="w-12 bg-transparent text-center text-[12px] tabular-nums outline-none placeholder:text-[color:var(--fg-soft)]/60"
      />
      <span className="px-0.5 text-[10px] text-[color:var(--fg-soft)]">h</span>
      <button
        type="button"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => step(0.5)}
        aria-label="增加 0.5 小时"
        className="h-6 w-6 rounded text-[color:var(--fg-muted)] hover:bg-[color:var(--border-soft)] hover:text-[color:var(--fg)]"
      >
        ＋
      </button>
    </div>
  );
}

/** 把分钟数格式化为"2 小时"/"1 小时 30 分钟"/"30 分钟"。 */
function formatDuration(min: number): string {
  if (min <= 0) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分钟`;
  if (h > 0) return `${h} 小时`;
  return `${m} 分钟`;
}

/** 从字符串解析分钟数：
 *   "1"       -> 60 （默认小时）
 *   "1.5"     -> 90
 *   "90m"     -> 90
 *   "1h30m"   -> 90
 *   "1小时半" -> 90
 */
function parseDuration(s: string): number | undefined {
  const t = s.trim().toLowerCase();
  if (!t) return undefined;
  // 形如 1h30m / 1.5h / 30m
  const hMatch = t.match(/([\d.]+)\s*(小时|h)/);
  const mMatch = t.match(/([\d.]+)\s*(分钟|分|m|min)/);
  if (hMatch || mMatch) {
    const h = hMatch ? parseFloat(hMatch[1]) : 0;
    const m = mMatch ? parseFloat(mMatch[1]) : 0;
    const total = Math.round(h * 60 + m);
    return total > 0 ? total : undefined;
  }
  // 纯数字：默认当小时（更符合"最小 0.5 小时"的语义）
  const n = parseFloat(t);
  if (Number.isFinite(n) && n > 0) return Math.round(n * 60);
  return undefined;
}
