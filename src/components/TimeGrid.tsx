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

    // 擦除：只擦色，不在日志区创建条目
    if (paintMode === "erase") {
      e.preventDefault();
      startDrag(i);
      return;
    }

    // 未选类别 / 选了类别：都让日志区在该 slot 上定位或创建条目
    // （日志 input 的 focus 已加 preventScroll: true，不会让页面跳到日志位置）
    onPickSlot(i);

    if (!paintMode) return;
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
              {/* 4 对半小时格：对内紧贴、对间留较大间距，便于视觉分辨小时边界 */}
              <div className="flex items-start gap-2">
                {[0, 1, 2, 3].map((p) => {
                  const pairIndices = [indices[p * 2], indices[p * 2 + 1]];
                  return (
                    <div key={p} className="flex flex-1 gap-[2px]">
                      {pairIndices.map((i) => {
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
                              "flex aspect-square flex-1 items-center justify-center rounded-[6px] border transition-all",
                              isActive && "ring-2 ring-[color:var(--accent)]",
                              // 空格子：仅边框 hover，避免和「个人」涂色背景冲突
                              !s &&
                                "bg-transparent border-[color:var(--border)] hover:border-[color:var(--fg-muted)]",
                            )}
                            style={
                              s
                                ? {
                                    backgroundColor: meta!.color + "33",
                                    borderColor: meta!.color + "80",
                                  }
                                : undefined
                            }
                          >
                            {s ? (
                              <CategoryIcon category={s} size={14} />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              {/* 每个小时下方居中只写一个整点数字 */}
              <div className="mt-1 flex gap-2 text-[10px] tabular-nums text-[color:var(--fg-soft)]">
                {[0, 1, 2, 3].map((p) => (
                  <div key={p} className="flex-1 text-center">
                    {String(band.start + p).padStart(2, "0")}
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
            <CategoryIcon category={c} size={14} />
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
            ? "border-[color:var(--fg)] bg-[color:var(--fg)] text-[color:var(--bg)]"
            : "border-[color:var(--border)] text-[color:var(--fg-muted)] hover:border-[color:var(--fg-muted)]",
        )}
        title="选中后点击或拖过格子可清除（再次点击关闭擦除态）"
      >
        <EraserIcon size={12} />
        <span>擦除</span>
      </button>
      <span className="ml-1 text-[11px] text-[color:var(--fg-soft)]">
        选类别后单击或拖过格子 · 未选时只定位日志
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
            <CategoryIcon category={c} size={13} />
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

/**
 * 各分类的小图标（lucide 风格 stroke svg）。
 *
 * - personal 个人：人像
 * - work 工作：公文包
 * - family 家人朋友：心形
 * - unavailable 不可支配：月亮（休息 / 睡眠 / 不投入）
 */
export function CategoryIcon({
  category,
  size = 14,
  className,
}: {
  category: TimeCategory;
  size?: number;
  className?: string;
}) {
  const stroke = TIME_CATEGORY_META[category].color;
  const common: React.SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };
  switch (category) {
    case "personal":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      );
    case "work":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      );
    case "family":
      return (
        <svg {...common}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "unavailable":
      return (
        <svg {...common}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
  }
}

function EraserIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 21H8" />
      <path d="M5.5 17.5l-2.5-2.5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0l4.83 4.83a2 2 0 0 1 0 2.83l-7.83 7.83a2 2 0 0 1-2.83 0l-3.67-3.67z" />
      <path d="M14 7l3 3" />
    </svg>
  );
}
