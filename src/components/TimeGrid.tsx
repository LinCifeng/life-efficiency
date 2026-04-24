"use client";

import { TIME_CATEGORY_META, type TimeCategory, type TimeSlot } from "@/lib/db";
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

export function TimeGrid({
  slots,
  selectedCategory,
  onChange,
}: {
  slots: TimeSlot[];
  selectedCategory: TimeCategory | null;
  onChange: (slots: TimeSlot[]) => void;
}) {
  // 48 格：每格 30 分钟；按 6 列排成 8 行，每行 3 小时
  const rows: number[][] = [];
  for (let r = 0; r < 8; r++) {
    rows.push(Array.from({ length: 6 }, (_, i) => r * 6 + i));
  }

  function setSlot(i: number) {
    const next = [...slots];
    next[i] = nextSlot(slots[i], selectedCategory);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, rIdx) => {
        const startHour = rIdx * 3;
        return (
          <div key={rIdx} className="flex items-center gap-2">
            <div className="w-10 text-right text-[10px] tabular-nums text-[color:var(--fg-soft)]">
              {String(startHour).padStart(2, "0")}
            </div>
            <div className="grid flex-1 grid-cols-6 gap-1">
              {row.map((i) => {
                const s = slots[i];
                const meta = s ? TIME_CATEGORY_META[s] : null;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlot(i)}
                    aria-label={`${Math.floor(i / 2)}:${i % 2 ? "30" : "00"}`}
                    className={clsx(
                      "flex aspect-square items-center justify-center rounded-[6px] text-sm transition-colors",
                      "border border-[color:var(--border)]",
                      !s && "bg-transparent hover:bg-[color:var(--border-soft)]",
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
            <div className="w-10 text-left text-[10px] tabular-nums text-[color:var(--fg-soft)]">
              {String(startHour + 3).padStart(2, "0")}
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
            style={
              active
                ? { backgroundColor: meta.color + "33" }
                : undefined
            }
          >
            <span style={{ color: meta.color, fontWeight: 600 }}>{meta.symbol}</span>
            <span>{meta.label}</span>
          </button>
        );
      })}
      <span className="ml-1 text-[11px] text-[color:var(--fg-soft)]">
        选中后点击格子即可快速填；再次点击清空
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
            <span className="tabular-nums text-[color:var(--fg-soft)]">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
