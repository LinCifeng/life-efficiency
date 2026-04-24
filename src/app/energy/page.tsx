"use client";

import { useMemo, useState } from "react";
import { addDays, formatDate } from "@/lib/db";
import { saveEnergy, useEnergy, useEnergyRange } from "@/lib/hooks";
import { DateSwitcher } from "@/components/DateSwitcher";
import { SectionLabel } from "@/components/SectionLabel";
import { EnergyGrid } from "@/components/EnergyGrid";
import { EnergyChart, type EnergySeries } from "@/components/EnergyChart";
import clsx from "clsx";

const COMPARE_COLORS = [
  "#a0845c",
  "#7a9269",
  "#b97466",
  "#c8b894",
  "#7a7065",
];

export default function EnergyPage() {
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [showCompare, setShowCompare] = useState(false);

  const entry = useEnergy(date);

  const compareDates = useMemo(() => {
    if (!showCompare) return [date];
    const arr: string[] = [];
    for (let i = 4; i >= 0; i--) arr.push(addDays(date, -i));
    return arr;
  }, [date, showCompare]);
  const comparedEntries = useEnergyRange(compareDates);

  const series: EnergySeries[] = useMemo(() => {
    if (!showCompare) {
      return [
        { label: "精力", color: "#a0845c", scores: entry.scores },
      ];
    }
    return compareDates.map((d, i) => {
      const found = comparedEntries.find((e) => e.date === d);
      return {
        label: d.slice(5),
        color: COMPARE_COLORS[i % COMPARE_COLORS.length],
        scores: found?.scores ?? Array(24).fill(null),
      };
    });
  }, [showCompare, entry.scores, compareDates, comparedEntries]);

  const filled = entry.scores.filter((s) => s != null) as number[];
  const avg =
    filled.length > 0
      ? (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1)
      : "—";
  const peak = filled.length > 0 ? Math.max(...filled) : "—";
  const low = filled.length > 0 ? Math.min(...filled) : "—";

  return (
    <div className="flex flex-col gap-6">
      <DateSwitcher date={date} onChange={setDate} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>24 小时精力曲线</SectionLabel>
          <button
            type="button"
            onClick={() => setShowCompare((v) => !v)}
            className={clsx(
              "rounded-full border px-3 py-1 text-[11px] transition-colors",
              showCompare
                ? "border-[color:var(--accent)] text-[color:var(--accent)]"
                : "border-[color:var(--border)] text-[color:var(--fg-muted)]",
            )}
          >
            {showCompare ? "单日视图" : "近 5 天对比"}
          </button>
        </div>
        <div className="card">
          <EnergyChart series={series} />
        </div>
      </section>

      {!showCompare && (
        <>
          <section className="space-y-3">
            <SectionLabel>打分 · 点击格子填入</SectionLabel>
            <div className="card">
              <EnergyGrid
                scores={entry.scores}
                onChange={(scores) => saveEnergy({ date, scores })}
              />
              <div className="mt-4 flex items-center gap-6 text-xs text-[color:var(--fg-muted)]">
                <Stat label="平均" value={String(avg)} />
                <Stat label="高点" value={String(peak)} />
                <Stat label="低点" value={String(low)} />
                <span className="ml-auto text-[10px] text-[color:var(--fg-soft)]">
                  10 = 最佳 · 1 = 最差
                </span>
              </div>
            </div>
          </section>

          <div className="rounded-xl border border-dashed border-[color:var(--border)] p-4 text-xs leading-relaxed text-[color:var(--fg-muted)]">
            连续记录 5 天可观察到自己的精力起伏规律：把重要、有难度的事安排在你的精力旺盛时间，事半功倍。
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] text-[color:var(--fg-soft)]">{label}</span>
      <span className="text-sm tabular-nums text-[color:var(--fg)]">{value}</span>
    </div>
  );
}
