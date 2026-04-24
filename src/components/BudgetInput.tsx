"use client";

import type { DailyEntry } from "@/lib/db";

export function BudgetInput({
  value,
  onChange,
}: {
  value: DailyEntry;
  onChange: (next: DailyEntry) => void;
}) {
  function patch(partial: Partial<DailyEntry["budget"]>) {
    onChange({ ...value, budget: { ...value.budget, ...partial } });
  }

  return (
    <div className="space-y-3">
      <Row icon="⏱" label="时间总预算">
        <HourInput
          value={value.totalBudgetHours}
          onChange={(v) => onChange({ ...value, totalBudgetHours: v })}
        />
      </Row>
      <div className="text-xs text-[color:var(--fg-muted)]">
        <span className="mr-2">⊙</span>预算时间分配
      </div>
      <div className="grid grid-cols-3 gap-3">
        <SubBudget
          symbol="☆"
          label="个人"
          value={value.budget.personal}
          onChange={(v) => patch({ personal: v })}
        />
        <SubBudget
          symbol="○"
          label="工作"
          value={value.budget.work}
          onChange={(v) => patch({ work: v })}
        />
        <SubBudget
          symbol="△"
          label="家人朋友"
          value={value.budget.family}
          onChange={(v) => patch({ family: v })}
        />
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-[color:var(--fg-muted)]">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

function SubBudget({
  symbol,
  label,
  value,
  onChange,
}: {
  symbol: string;
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-card)] px-3 py-2">
      <div className="mb-1 flex items-center gap-1 text-[11px] text-[color:var(--fg-muted)]">
        <span>{symbol}</span>
        <span>{label}</span>
      </div>
      <HourInput value={value} onChange={onChange} />
    </div>
  );
}

function HourInput({
  value,
  onChange,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={24}
        step={0.5}
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? undefined : Number(v));
        }}
        className="w-14 rounded-md bg-transparent px-1 py-0.5 text-right text-sm tabular-nums outline-none focus:bg-[color:var(--border-soft)]"
        placeholder="—"
      />
      <span className="text-xs text-[color:var(--fg-soft)]">小时</span>
    </div>
  );
}
