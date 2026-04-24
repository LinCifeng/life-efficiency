"use client";

import { cryptoId, type TimeLog } from "@/lib/db";
import { IMEInput } from "@/components/IMEInput";
import { slotRangeLabel } from "@/components/TimeGrid";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

const SCORE_LABEL = ["低效", "偏低", "一般", "偏高", "高效"];

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

  function patch(id: string, partial: Partial<TimeLog>) {
    onChange(logs.map((l) => (l.id === id ? { ...l, ...partial } : l)));
  }

  function remove(id: string) {
    onChange(logs.filter((l) => l.id !== id));
  }

  /**
   * 同一时段同一 slot 只保留一条日志。
   * 若目标 slot 已有日志，则把新文本以「；」追加到已有记录后面，
   * 这样既不会丢数据，也不会出现两条重复时段。
   */
  function addLog(slotIndex: number, text: string, efficiency?: number) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const existing = logs.find((l) => l.slotIndex === slotIndex);
    if (existing) {
      onChange(
        logs.map((l) =>
          l.id === existing.id
            ? {
                ...l,
                text: l.text.trim()
                  ? `${l.text.trim()}；${trimmed}`
                  : trimmed,
                efficiency: l.efficiency ?? efficiency,
              }
            : l,
        ),
      );
      return;
    }
    onChange([
      ...logs,
      { id: cryptoId(), slotIndex, text: trimmed, efficiency },
    ]);
  }

  // 已用过的 slot 集合，用于 QuickAdd 下拉显示提示
  const usedSlots = useMemo(
    () => new Set(logs.map((l) => l.slotIndex)),
    [logs],
  );

  return (
    <div className="space-y-3">
      <QuickAdd
        inputRef={newInputRef}
        activeSlot={activeSlot}
        usedSlots={usedSlots}
        onSubmit={(slot, text) => {
          addLog(slot, text);
          onFocusSlot(null);
        }}
      />

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-4 text-center text-xs text-[color:var(--fg-soft)]">
          还没有记录。点击上方时间格会自动定位，或在下拉里选时段，写下这半小时你在做什么。
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
                value={log.text}
                onChange={(v) => patch(log.id, { text: v })}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--fg-soft)]"
                placeholder="做了什么？"
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

function QuickAdd({
  activeSlot,
  inputRef,
  usedSlots,
  onSubmit,
}: {
  activeSlot: number | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  usedSlots: Set<number>;
  onSubmit: (slot: number, text: string) => void;
}) {
  const [slot, setSlot] = useState<number>(activeSlot ?? new Date().getHours() * 2);
  const [text, setText] = useState("");
  const composingRef = useRef(false);

  useEffect(() => {
    if (activeSlot != null) setSlot(activeSlot);
  }, [activeSlot]);

  function submit() {
    const v = text.trim();
    if (!v) return;
    onSubmit(slot, v);
    setText("");
  }

  const isUsed = usedSlots.has(slot);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-card)] px-2 py-1.5">
        <SlotSelect value={slot} onChange={setSlot} usedSlots={usedSlots} />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
          placeholder={
            isUsed ? "该时段已有记录，将追加到原条" : "做了什么？回车或点别处保存"
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !composingRef.current) {
              e.preventDefault();
              submit();
            }
          }}
          onBlur={() => {
            submit();
          }}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--fg-soft)]"
        />
      </div>
      {isUsed && (
        <div className="px-1 text-[10px] text-[color:var(--fg-soft)]">
          ●&nbsp;该时段已有记录，新文本会追加而不是新开一条
        </div>
      )}
    </div>
  );
}

function SlotSelect({
  value,
  onChange,
  usedSlots,
}: {
  value: number;
  onChange: (v: number) => void;
  usedSlots: Set<number>;
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
          {usedSlots.has(i) ? " ●" : ""}
        </option>
      ))}
    </select>
  );
}
