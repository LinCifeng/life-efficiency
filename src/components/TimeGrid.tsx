"use client";

import {
  TIME_CATEGORY_META,
  type TimeCategory,
  type TimeSlot,
} from "@/lib/db";
import clsx from "clsx";

// 半小时格 -> 轮换下一个状态
const CYCLE: TimeSlot[] = ["personal", "work", "family", "unavailable", null];

function nextSlot(current: TimeSlot, selected: TimeCategory | null): TimeSlot {
  if (selected) {
    return current === selected ? null : selected;
  }
  const i = CYCLE.indexOf(current);
  return CYCLE[(i + 1) % CYCLE.length];
}

const BANDS: Array<{ start: number; label: string }> = [
  { start: 0, label: "凌晨" },
  { start: 4, label: "清晨" },
  { start: 8, label: "上午" },
  { start: 12, label: "下午" },
  { start: 16, label: "傍晚" },
  { start: 20, label: "夜晚" },
];

export function slotLabel(i: number): string {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
}

export function slotRangeLabel(i: number): string {
  const start = slotLabel(i);
  const nextH = Math.floor((i + 1) / 2);
  const nextM = (i + 1) % 2 === 0 ? "00" : "30";
  const end = `${String(nextH % 24).padStart(2, "0")}:${nextM}`;
  return `${start}–${end}`;
}

export function TimeGrid({
  slots,
  selectedCategory,
  activeSlot,
  onChange,
  onPickSlot,
}: {
  slots: TimeSlot[];
  selectedCategory: TimeCategory | null;
  activeSlot: number | null;
  onChange: (slots: TimeSlot[]) => void;
  onPickSlot: (i: number) => void;
}) {
  function setSlot(i: number) {
    const next = [...slots];
    next[i] = nextSlot(slots[i], selectedCategory);
    onChange(next);
    onPickSlot(i);
  }

  return (
    <div className="flex flex-col gap-3">
      {BANDS.map((band) => {
        // 每个时段 4 小时 = 8 格
        const indices = Array.from({ length: 8 }, (_, k) => band.start * 2 + k);
        return (
          <div key={band.start} className="flex items-stretch gap-3">
            {/* 左侧时段标签 */}
            <div className="flex w-12 shrink-0 flex-col justify-center">
              <div className="text-[13px] font-medium text-[color:var(--fg)]">
                {band.label}
              </div>
              <div className="text-[10px] tabular-nums text-[color:var(--fg-soft)]">
                {String(band.start).padStart(2, "0")}:00–
                {String(band.start + 4).padStart(2, "0")}:00
              </div>
            </div>

            {/* 格子 + 刻度 */}
            <div className="flex-1">
              <div className="grid grid-cols-8 gap-1">
                {indices.map((i) => {
                  const s = slots[i];
                  const meta = s ? TIME_CATEGORY_META[s] : null;
                  const isActive = activeSlot === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlot(i)}
                      aria-label={slotRangeLabel(i)}
                      title={slotRangeLabel(i)}
                      className={clsx(
                        "flex aspect-square items-center justify-center rounded-[6px] border text-sm transition-all",
                        isActive && "ring-2 ring-[color:var(--accent)]",
                        !s && "bg-transparent hover:bg-[color:var(--border-soft)]",
                        !s && "border-[color:var(--border)]",
                      )}
                      style={
                        s
                          ? {
                              backgroundColor: meta!.color + "33",
                              borderColor: meta!.color + "80",
                              color: "var(--fg)",
                            }
                          : undefined
                      }
                    >
                      {meta?.symbol ?? ""}
                    </button>
                  );
                })}
              </div>
              {/* 整点刻度：2 格对应一个整点 */}
              <div className="mt-1 grid grid-cols-8 text-[10px] tabular-nums text-[color:var(--fg-soft)]">
                {indices.map((i, k) => (
                  <div key={i} className="text-center">
                    {k % 2 === 0 ? String(Math.floor(i / 2)).padStart(2, "0") : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CategoryPicker({
  value,
  onChange,
}: {
  value: TimeCategory | null;
  onChange: (value: TimeCategory | null) => void;
}) {
  const cats: TimeCategory[] = ["personal", "work", "family", "unavailable"];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {cats.map((c) => {
        const meta = TIME_CATEGORY_META[c];
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(active ? null : c)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-[color:var(--accent)] text-[color:var(--fg)]"
                : "border-[color:var(--border)] text-[color:var(--fg-muted)] hover:border-[color:var(--accent-soft)]",
            )}
            style={active ? { backgroundColor: meta.color + "33" } : undefined}
          >
            <span style={{ color: meta.color, fontWeight: 600 }}>
              {meta.symbol}
            </span>
            <span>{meta.label}</span>
          </button>
        );
      })}
      <span className="ml-1 text-[11px] text-[color:var(--fg-soft)]">
        选中后点格子批量填；未选时点格子循环切换
      </span>
    </div>
  );
}

export function TimeSummary({ slots }: { slots: TimeSlot[] }) {
  const count: Record<TimeCategory, number> = {
    personal: 0,
    work: 0,
    family: 0,
    unavailable: 0,
  };
  for (const s of slots) if (s) count[s]++;
  const total = slots.filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
      {(Object.keys(count) as TimeCategory[]).map((c) => {
        const hours = (count[c] * 0.5).toFixed(1);
        const pct =
          total > 0 ? ((count[c] / total) * 100).toFixed(0) : "0";
        const meta = TIME_CATEGORY_META[c];
        return (
          <div key={c} className="flex items-center gap-1.5">
            <span style={{ color: meta.color }}>{meta.symbol}</span>
            <span className="text-[color:var(--fg-muted)]">{meta.label}</span>
            <span className="tabular-nums text-[color:var(--fg)]">{hours}h</span>
            <span className="tabular-nums text-[color:var(--fg-soft)]">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
