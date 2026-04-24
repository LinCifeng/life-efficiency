"use client";

import {
  TIME_CATEGORY_META,
  type TimeCategory,
  type TimeSlot,
} from "@/lib/db";
import clsx from "clsx";
import { useCallback, useEffect, useRef } from "react";

export type PaintMode = TimeCategory | "erase";

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
  paintMode,
  activeSlot,
  onChange,
  onPickSlot,
}: {
  slots: TimeSlot[];
  paintMode: PaintMode | null;
  activeSlot: number | null;
  onChange: (slots: TimeSlot[]) => void;
  onPickSlot: (i: number) => void;
}) {
  // 拖动涂改相关 refs
  const draggingRef = useRef(false);
  const paintedRef = useRef<Set<number>>(new Set());
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const containerRef = useRef<HTMLDivElement>(null);

  const applyTo = useCallback(
    (i: number) => {
      if (paintedRef.current.has(i)) return;
      paintedRef.current.add(i);
      const target: TimeSlot =
        paintMode === "erase" ? null : (paintMode as TimeCategory);
      const next = [...slotsRef.current];
      if (next[i] === target) return;
      next[i] = target;
      slotsRef.current = next;
      onChange(next);
    },
    [paintMode, onChange],
  );

  function slotIndexAtPoint(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const btn = el?.closest<HTMLElement>("[data-slot]");
    if (!btn) return null;
    const v = btn.getAttribute("data-slot");
    if (v == null) return null;
    const idx = Number(v);
    return Number.isFinite(idx) ? idx : null;
  }

  function startDrag(i: number) {
    draggingRef.current = true;
    paintedRef.current = new Set();
    if (paintMode) applyTo(i);
  }

  function endDrag() {
    draggingRef.current = false;
    paintedRef.current.clear();
  }

  // 全局 pointerup / pointercancel 兜底结束拖拽
  useEffect(() => {
    const onUp = () => endDrag();
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  function handlePointerDown(e: React.PointerEvent, i: number) {
    // 只处理主键/单指
    if (e.pointerType === "mouse" && e.button !== 0) return;
    onPickSlot(i);
    if (!paintMode) return; // 没选类别：只 focus 日志，不改格子
    e.preventDefault();
    startDrag(i);
  }

  function handleContainerPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || !paintMode) return;
    const idx = slotIndexAtPoint(e.clientX, e.clientY);
    if (idx != null) applyTo(idx);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handleContainerPointerMove}
      style={{ touchAction: "none" }}
      className="flex select-none flex-col gap-3"
    >
      {BANDS.map((band) => {
        const indices = Array.from({ length: 8 }, (_, k) => band.start * 2 + k);
        return (
          <div key={band.start} className="flex items-stretch gap-3">
            <div className="flex w-12 shrink-0 flex-col justify-center">
              <div className="text-[13px] font-medium text-[color:var(--fg)]">
                {band.label}
              </div>
              <div className="text-[10px] tabular-nums text-[color:var(--fg-soft)]">
                {String(band.start).padStart(2, "0")}:00–
                {String(band.start + 4).padStart(2, "0")}:00
              </div>
            </div>

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
                      data-slot={i}
                      onPointerDown={(e) => handlePointerDown(e, i)}
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
  value: PaintMode | null;
  onChange: (value: PaintMode | null) => void;
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
      <button
        type="button"
        onClick={() => onChange(value === "erase" ? null : "erase")}
        className={clsx(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
          value === "erase"
            ? "border-[color:var(--fg)] bg-[color:var(--border-soft)] text-[color:var(--fg)]"
            : "border-[color:var(--border)] text-[color:var(--fg-muted)] hover:border-[color:var(--fg-muted)]",
        )}
        title="选中后点击或拖过格子可清除"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3l5 5-11 11H5v-5z" />
          <path d="M13.5 5.5l5 5" />
        </svg>
        <span>擦除</span>
      </button>
      <span className="ml-1 text-[11px] text-[color:var(--fg-soft)]">
        选类别后单击或按住拖过格子 · 未选时只定位日志
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
