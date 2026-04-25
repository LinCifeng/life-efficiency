"use client";

import { cryptoId, type TimeLog } from "@/lib/db";
import { IMEInput } from "@/components/IMEInput";
import { slotRangeLabel } from "@/components/TimeGrid";
import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";

const SCORE_LABEL = ["低效", "偏低", "一般", "偏高", "高效"];

/**
 * 今日时间日志。
 *
 * 交互：
 *  1. 列表始终按 slotIndex 升序展示，新条目就直接插入到对应时间位置（不在最上面）。
 *  2. 用户在 24h 格子上点击 → activeSlot 改变 → 这里若该 slot 还没有日志，就自动
 *     创建一条空 log，并 focus 它的输入框；用户直接打字即可，不再需要回车。
 *  3. 输入即保存（IMEInput 内部已处理）。
 *  4. 失焦时如果文本仍为空，自动删掉这条空 log，避免留下脏数据。
 */
export function TimeLogList({
  logs,
  activeSlot,
  onChange,
  onFocusSlot,
}: {
  logs: TimeLog[];
  activeSlot: number | null;
  onChange: (logs: TimeLog[]) => void;
  onFocusSlot: (slot: number | null) => void;
}) {
  const sorted = useMemo(
    () => [...logs].sort((a, b) => a.slotIndex - b.slotIndex),
    [logs],
  );

  // 记录"想要 focus 的 log id"，等渲染完成后由 effect 真正聚焦
  const pendingFocusRef = useRef<string | null>(null);
  // 记录每个 log 的 input 引用
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  // 始终指向最新 logs，effect 闭包用它来避免连续点击时拿到陈旧数据
  const logsRef = useRef(logs);
  logsRef.current = logs;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function setInputRef(id: string, el: HTMLInputElement | null) {
    if (el) inputRefs.current.set(id, el);
    else inputRefs.current.delete(id);
  }

  function patch(id: string, partial: Partial<TimeLog>) {
    onChange(logs.map((l) => (l.id === id ? { ...l, ...partial } : l)));
  }

  function remove(id: string) {
    onChange(logs.filter((l) => l.id !== id));
  }

  // activeSlot 变化时：若该 slot 没有日志，创建空 log 并标记 focus；若已有，直接聚焦。
  // activeSlot 变 null 时（用户切到擦除 / 取消类别），主动把当前聚焦的日志 input
  // blur 掉，避免还有光标停在某条日志上。
  useEffect(() => {
    if (activeSlot == null) {
      for (const el of inputRefs.current.values()) {
        if (el === document.activeElement) {
          el.blur();
          break;
        }
      }
      return;
    }
    const cur = logsRef.current;
    const existing = cur.find((l) => l.slotIndex === activeSlot);
    if (existing) {
      pendingFocusRef.current = existing.id;
      const el = inputRefs.current.get(existing.id);
      if (el) {
        el.focus({ preventScroll: true });
        const len = el.value.length;
        el.setSelectionRange(len, len);
        pendingFocusRef.current = null;
      }
      return;
    }
    const fresh: TimeLog = {
      id: cryptoId(),
      slotIndex: activeSlot,
      text: "",
    };
    pendingFocusRef.current = fresh.id;
    onChangeRef.current([...cur, fresh]);
  }, [activeSlot]);

  // 渲染完成后，如果有待聚焦的 id，找到 input 并 focus
  useEffect(() => {
    const id = pendingFocusRef.current;
    if (!id) return;
    const el = inputRefs.current.get(id);
    if (el) {
      el.focus({ preventScroll: true });
      const len = el.value.length;
      el.setSelectionRange(len, len);
      pendingFocusRef.current = null;
    }
  }, [sorted]);

  return (
    <div className="space-y-2">
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-4 text-center text-xs text-[color:var(--fg-soft)]">
          点击上方 24 小时格子里的某一格，即可在这里直接写下那半小时做了什么。
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--border-soft)]">
          {sorted.map((log) => (
            <li
              key={log.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 sm:flex-nowrap"
              onFocus={() => onFocusSlot(log.slotIndex)}
            >
              <span className="w-24 shrink-0 tabular-nums text-xs text-[color:var(--fg-muted)]">
                {slotRangeLabel(log.slotIndex)}
              </span>
              <IMEInput
                ref={(el) => setInputRef(log.id, el)}
                value={log.text}
                onChange={(v) => patch(log.id, { text: v })}
                onBlur={() => {
                  // 离开时如果还是空，删掉这条空记录
                  if (!log.text.trim()) {
                    remove(log.id);
                  }
                }}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--fg-soft)]"
                placeholder="做了什么？打字即存"
              />
              <EfficiencyPicker
                value={log.efficiency}
                onChange={(v) => patch(log.id, { efficiency: v })}
              />
              <button
                type="button"
                onClick={() => remove(log.id)}
                aria-label="删除"
                className="text-[color:var(--fg-soft)] transition-colors hover:text-[color:var(--fg)]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 5 档打分条，水平 5 个稍大的条块，便于点击。 */
function EfficiencyPicker({
  value,
  onChange,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-1"
      title="效率评分（再次点击可取消）"
    >
      <span className="mr-1 w-8 text-right text-[11px] text-[color:var(--fg-soft)]">
        {value ? SCORE_LABEL[value - 1] : "评分"}
      </span>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value != null && n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${SCORE_LABEL[n - 1]} · ${n} 分`}
            onClick={() => onChange(value === n ? undefined : n)}
            className={clsx(
              "h-6 w-3.5 rounded-[3px] border transition-colors",
              on
                ? "border-transparent bg-[color:var(--accent)]"
                : "border-[color:var(--border)] bg-transparent hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)]",
            )}
          />
        );
      })}
    </div>
  );
}
