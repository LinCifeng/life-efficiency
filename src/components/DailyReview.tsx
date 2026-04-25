"use client";

import type { DailyEntry } from "@/lib/db";
import { IMETextarea } from "@/components/IMEInput";

/**
 * 每日复盘：放在 Today 页底部，3 个小问题给一天一个收尾。
 * 字段对应 DailyEntry.review。打字即存，无需手动保存。
 */
export function DailyReview({
  value,
  onChange,
}: {
  value: DailyEntry;
  onChange: (next: DailyEntry) => void;
}) {
  const review = value.review ?? {};
  function patch(partial: Partial<NonNullable<DailyEntry["review"]>>) {
    onChange({ ...value, review: { ...review, ...partial } });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field
        symbol="✦"
        label="今日亮点"
        placeholder="今天最有成就感、做对了的一件事…"
        value={review.highlight ?? ""}
        onChange={(v) => patch({ highlight: v })}
      />
      <Field
        symbol="✕"
        label="改进 / 不足"
        placeholder="哪里被卡住了？哪些其实可以不做？"
        value={review.improve ?? ""}
        onChange={(v) => patch({ improve: v })}
      />
      <Field
        symbol="→"
        label="给明天的我"
        placeholder="一句话提醒、或者明天最先要做的事…"
        value={review.tomorrow ?? ""}
        onChange={(v) => patch({ tomorrow: v })}
      />
    </div>
  );
}

function Field({
  symbol,
  label,
  placeholder,
  value,
  onChange,
}: {
  symbol: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[11px] text-[color:var(--fg-muted)]">
        <span className="text-[color:var(--accent)]">{symbol}</span>
        <span>{label}</span>
      </div>
      <IMETextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-lg border border-[color:var(--border)] bg-transparent px-2.5 py-2 text-sm leading-6 outline-none placeholder:text-[color:var(--fg-soft)] focus:border-[color:var(--accent-soft)] focus:bg-[color:var(--bg-card)]"
      />
    </div>
  );
}
