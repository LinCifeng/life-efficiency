"use client";

import { cryptoId, type TimeLog } from "@/lib/db";
import { IMEInput } from "@/components/IMEInput";
import { slotRangeLabel } from "@/components/TimeGrid";
import { useEffect, useMemo, useRef } from "react";

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
  const newInputRef = useRef<HTMLInputElement>(null);

  // 外部点击时间格时，若该格暂无日志则准备一条，并 focus 进输入框
  useEffect(() => {
    if (activeSlot == null) return;
    const exists = logs.some((l) => l.slotIndex === activeSlot);
    if (!exists && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [activeSlot, logs]);

  function patch(id: string, partial: Partial<TimeLog>) {
    onChange(logs.map((l) => (l.id === id ? { ...l, ...partial } : l)));
  }

  function remove(id: string) {
    onChange(logs.filter((l) => l.id !== id));
  }

  function addLog(slotIndex: number, text: string) {
    if (!text.trim()) return;
    onChange([
      ...logs,
      { id: cryptoId(), slotIndex, text: text.trim() },
    ]);
  }

  return (
    <div className="space-y-3">
      {/* 快速新增 */}
      <QuickAdd
        inputRef={newInputRef}
        activeSlot={activeSlot}
        onSubmit={(slot, text) => {
          addLog(slot, text);
          onFocusSlot(null);
        }}
      />

      {/* 已有日志 */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-4 text-center text-xs text-[color:var(--fg-soft)]">
          还没有记录。点击上方的时间格，或直接在下拉里选时段，写下这半小时你在做什么。
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--border-soft)]">
          {sorted.map((log) => (
            <li
              key={log.id}
              className="flex items-center gap-3 py-2"
              onFocus={() => onFocusSlot(log.slotIndex)}
            >
              <span className="w-24 shrink-0 tabular-nums text-xs text-[color:var(--fg-muted)]">
                {slotRangeLabel(log.slotIndex)}
              </span>
              <IMEInput
                value={log.text}
                onChange={(v) => patch(log.id, { text: v })}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--fg-soft)]"
                placeholder="做了什么？"
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

function QuickAdd({
  activeSlot,
  inputRef,
  onSubmit,
}: {
  activeSlot: number | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (slot: number, text: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-card)] px-2 py-1.5">
      <SlotSelect
        value={activeSlot ?? 0}
        onChange={(v) => {
          // 只是调整当前选中的时段；实际提交在 input 里按回车
          const input = inputRef.current;
          if (input) {
            input.dataset.slot = String(v);
          }
        }}
      />
      <input
        ref={inputRef}
        type="text"
        data-slot={String(activeSlot ?? 0)}
        placeholder="做了什么？按回车保存"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            const el = e.currentTarget;
            const slot = Number(el.dataset.slot ?? "0");
            onSubmit(slot, el.value);
            el.value = "";
          }
        }}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--fg-soft)]"
      />
    </div>
  );
}

function SlotSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded bg-transparent px-1.5 py-0.5 text-xs tabular-nums text-[color:var(--fg-muted)] outline-none"
    >
      {Array.from({ length: 48 }, (_, i) => (
        <option key={i} value={i}>
          {slotRangeLabel(i)}
        </option>
      ))}
    </select>
  );
}
