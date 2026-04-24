"use client";

import type { DailyEntry } from "@/lib/db";
import { useEffect, useState } from "react";

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

  // 合计：三项子预算加起来，方便对比总预算是否合理
  const allocated =
    (value.budget.personal ?? 0) +
    (value.budget.work ?? 0) +
    (value.budget.family ?? 0);
  const total = value.totalBudgetHours ?? 0;
  const remain = total > 0 ? total - allocated : null;

  return (
    <div className="space-y-3">
      <Row icon="⏱" label="时间总预算">
        <HourInput
          value={value.totalBudgetHours}
          onChange={(v) => onChange({ ...value, totalBudgetHours: v })}
        />
      </Row>
      <div className="flex items-center justify-between text-xs text-[color:var(--fg-muted)]">
        <span>
          <span className="mr-2">⊙</span>预算时间分配
        </span>
        {(allocated > 0 || total > 0) && (
          <span className="tabular-nums text-[11px] text-[color:var(--fg-soft)]">
            已分配 {allocated} h
            {total > 0 && (
              <>
                {" "}/ 总 {total} h
                {remain !== null && remain !== 0 && (
                  <span
                    className={
                      remain < 0
                        ? "ml-2 text-[color:var(--accent)]"
                        : "ml-2"
                    }
                  >
                    {remain < 0 ? `超 ${-remain} h` : `剩 ${remain} h`}
                  </span>
                )}
              </>
            )}
          </span>
        )}
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

/**
 * 小时输入框。
 * 之前用 type="number" + 每次 onChange 即时保存，在输入小数中间态（如 "3."）时浏览器
 * 会把 e.target.value 置空，导致 onChange(undefined)，用户会以为"数据存不住"。
 * 这里改成 type="text" + 本地 draft + blur 提交，彻底解决这个问题。
 */
function HourInput({
  value,
  onChange,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  const [draft, setDraft] = useState<string>(value != null ? String(value) : "");
  const [editing, setEditing] = useState(false);

  // 外部值变化时，若用户没在编辑，则同步回来
  useEffect(() => {
    if (!editing) setDraft(value != null ? String(value) : "");
  }, [value, editing]);

  function commit() {
    const t = draft.trim();
    if (t === "") {
      onChange(undefined);
      return;
    }
    const n = parseFloat(t);
    if (Number.isFinite(n) && n >= 0) {
      onChange(n);
      setDraft(String(n));
    } else {
      // 非法输入回滚到 value
      setDraft(value != null ? String(value) : "");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onFocus={(e) => {
          setEditing(true);
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-14 rounded-md bg-transparent px-1 py-0.5 text-right text-sm tabular-nums outline-none focus:bg-[color:var(--border-soft)]"
        placeholder="—"
      />
      <span className="text-xs text-[color:var(--fg-soft)]">小时</span>
    </div>
  );
}
