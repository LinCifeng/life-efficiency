"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  addDays,
  cryptoId,
  db,
  formatDate,
  parseDate,
  TIME_CATEGORY_META,
  type ReflectionEntry,
  type TimeCategory,
} from "@/lib/db";
import { useDailyRange } from "@/lib/hooks";
import { SectionLabel } from "@/components/SectionLabel";
import clsx from "clsx";

type Mode = "month" | "year";

export default function ReviewPage() {
  const [mode, setMode] = useState<Mode>("month");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium tracking-tight">复盘与总结</h1>
        <div className="flex gap-1 rounded-full bg-[color:var(--border-soft)] p-0.5 text-xs">
          <ModeBtn active={mode === "month"} onClick={() => setMode("month")}>
            四周复盘
          </ModeBtn>
          <ModeBtn active={mode === "year"} onClick={() => setMode("year")}>
            年度总结
          </ModeBtn>
        </div>
      </div>

      {mode === "month" ? <MonthReview /> : <YearReview />}
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-full px-3 py-1 transition-colors",
        active
          ? "bg-[color:var(--bg-card)] text-[color:var(--fg)] shadow-sm"
          : "text-[color:var(--fg-muted)]",
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// 四周复盘
// ─────────────────────────────────────────────────────────
function MonthReview() {
  // 以今天为参考，默认复盘过去 28 天
  const today = formatDate(new Date());
  const [endDate, setEndDate] = useState(today);
  const startDate = addDays(endDate, -27);
  const id = `month-${startDate}_${endDate}`;

  const entry = useLiveQuery(() => db.reflections.get(id), [id]);
  const current: ReflectionEntry = entry ?? {
    id,
    kind: "month",
    rangeLabel: `${startDate.slice(5)} ~ ${endDate.slice(5)}`,
    updatedAt: Date.now(),
  };

  function patch(partial: Partial<ReflectionEntry>) {
    db.reflections.put({ ...current, ...partial, updatedAt: Date.now() });
  }

  const dates = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < 28; i++) arr.push(addDays(startDate, i));
    return arr;
  }, [startDate]);

  return (
    <div className="flex flex-col gap-6">
      <RangeNav endDate={endDate} onChange={setEndDate} />
      <TimeAuditSummary dates={dates} />

      <section className="space-y-3">
        <SectionLabel>四周阶段性复盘</SectionLabel>
        <div className="card space-y-4">
          <Prompt
            title="个人成长"
            hints={[
              "这几周的个人时间分配是否符合预期？",
              "是否利用时间有效自主性在提高？",
              "这段时间获得了哪些成长与进步（技能、知识等）？",
            ]}
            value={current.personalGrowth ?? ""}
            onChange={(v) => patch({ personalGrowth: v })}
          />
          <Prompt
            title="工作效率"
            hints={[
              "是否完成了最重要的任务？",
              "哪些事情被拖延或改期？原因是？",
              "下月可以如何优化节奏？",
            ]}
            value={current.workEfficiency ?? ""}
            onChange={(v) => patch({ workEfficiency: v })}
          />
          <Prompt
            title="家人 / 朋友"
            hints={[
              "这段时间和重要的人相处得如何？",
              "有哪些温暖或遗憾？",
              "下月想和谁有什么约定？",
            ]}
            value={current.relationship ?? ""}
            onChange={(v) => patch({ relationship: v })}
          />
        </div>
      </section>
    </div>
  );
}

function RangeNav({
  endDate,
  onChange,
}: {
  endDate: string;
  onChange: (v: string) => void;
}) {
  const start = addDays(endDate, -27);
  const endD = parseDate(endDate);
  const startD = parseDate(start);
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-[color:var(--fg-soft)]">复盘区间</div>
        <div className="text-lg font-medium tracking-tight tabular-nums">
          {startD.getMonth() + 1}/{startD.getDate()}
          <span className="mx-2 text-[color:var(--fg-soft)]">→</span>
          {endD.getMonth() + 1}/{endD.getDate()}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconBtn onClick={() => onChange(addDays(endDate, -28))}>← 上一期</IconBtn>
        <IconBtn onClick={() => onChange(addDays(endDate, 28))}>下一期 →</IconBtn>
      </div>
    </div>
  );
}

function IconBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-full px-3 py-1 text-xs text-[color:var(--fg-muted)] transition-colors hover:bg-[color:var(--border-soft)]"
    />
  );
}

function Prompt({
  title,
  hints,
  value,
  onChange,
}: {
  title: string;
  hints: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-[color:var(--fg)]">{title}</div>
      <ul className="space-y-0.5 text-[11px] leading-relaxed text-[color:var(--fg-soft)]">
        {hints.map((h) => (
          <li key={h}>· {h}</li>
        ))}
      </ul>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="写下你的思考……"
        className="w-full resize-none rounded-lg border border-[color:var(--border)] bg-transparent p-2 text-sm leading-relaxed outline-none focus:border-[color:var(--accent-soft)]"
      />
    </div>
  );
}

// 汇总近 28 天时间格 -> 各维度百分比
function TimeAuditSummary({ dates }: { dates: string[] }) {
  const entries = useDailyRange(dates);
  const stats: Record<TimeCategory, number> = {
    personal: 0,
    work: 0,
    family: 0,
    unavailable: 0,
  };
  let total = 0;
  for (const e of entries) {
    for (const s of e.slots) {
      if (s) {
        stats[s]++;
        total++;
      }
    }
  }
  const recordedDays = entries.filter((e) =>
    e.slots.some((s) => s != null),
  ).length;

  if (recordedDays === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--border)] p-4 text-xs text-[color:var(--fg-muted)]">
        这 28 天还没有时间记录。回到「今日」开始记录吧 →
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <SectionLabel>时间审计分析</SectionLabel>
      <div className="card space-y-3">
        <div className="text-xs text-[color:var(--fg-muted)]">
          已记录 <span className="tabular-nums text-[color:var(--fg)]">{recordedDays}</span> 天
          · 共 <span className="tabular-nums text-[color:var(--fg)]">{(total * 0.5).toFixed(1)}</span> 小时
        </div>
        <div className="space-y-2">
          {(Object.keys(stats) as TimeCategory[]).map((c) => {
            const meta = TIME_CATEGORY_META[c];
            const pct = total > 0 ? (stats[c] / total) * 100 : 0;
            const avgPerDay = recordedDays
              ? ((stats[c] * 0.5) / recordedDays).toFixed(1)
              : "0";
            return (
              <div key={c} className="flex items-center gap-3">
                <div className="flex w-20 items-center gap-1.5 text-xs text-[color:var(--fg-muted)]">
                  <span style={{ color: meta.color }}>{meta.symbol}</span>
                  <span>{meta.label}</span>
                </div>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--border-soft)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: meta.color,
                    }}
                  />
                </div>
                <div className="w-24 text-right text-xs tabular-nums text-[color:var(--fg-muted)]">
                  每天 {avgPerDay}h · {pct.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// 年度总结
// ─────────────────────────────────────────────────────────
function YearReview() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const id = `year-${year}`;
  const entry = useLiveQuery(() => db.reflections.get(id), [id]);
  const current: ReflectionEntry = entry ?? {
    id,
    kind: "year",
    rangeLabel: `${year} 年度`,
    updatedAt: Date.now(),
  };
  function patch(partial: Partial<ReflectionEntry>) {
    db.reflections.put({ ...current, ...partial, updatedAt: Date.now() });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium tabular-nums">{year} 年</div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => setYear(year - 1)}>← {year - 1}</IconBtn>
          <IconBtn onClick={() => setYear(year + 1)}>{year + 1} →</IconBtn>
        </div>
      </div>

      <section className="space-y-3">
        <SectionLabel>年度大总结</SectionLabel>
        <div className="card space-y-4">
          <Prompt
            title="个人成长"
            hints={[
              "体会到了哪些问题、秘密、规则？",
              "过去一年学到的最重要的技能或知识是什么？",
              "有哪些理念、态度和习惯值得继续坚持？",
            ]}
            value={current.personalGrowth ?? ""}
            onChange={(v) => patch({ personalGrowth: v })}
          />
          <Prompt
            title="工作成就"
            hints={[
              "遇到了哪些挑战？做出了哪些重要决策？",
              "带来了哪些积极的影响和改变？",
            ]}
            value={current.workEfficiency ?? ""}
            onChange={(v) => patch({ workEfficiency: v })}
          />
          <Prompt
            title="家人 / 朋友"
            hints={[
              "过去一年有哪些快乐的时刻值得回忆？",
              "对亲密关系产生了哪些积极影响？",
            ]}
            value={current.relationship ?? ""}
            onChange={(v) => patch({ relationship: v })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>PS · 愿望清单</SectionLabel>
        <div className="card">
          <p className="mb-3 text-[11px] leading-relaxed text-[color:var(--fg-soft)]">
            认真写下每一个愿望，并适时安排在每日清单里。愿望才会化为现实。内容不必宏大，
            写得越具体越好。每个小改变，都将汇聚成你人生中了不起的进步。
          </p>
          <textarea
            value={current.wishes ?? ""}
            onChange={(e) => patch({ wishes: e.target.value })}
            rows={8}
            placeholder={`1. 阅读是心灵之丰悦的最小行动，并做笔记\n2. 坚持健身5次/周以上\n3. 每周户外运动至少2-3小时\n4. 每6个月参加一次公益活动，结交新朋友`}
            className="w-full resize-none rounded-lg border border-[color:var(--border)] bg-transparent p-3 text-sm leading-relaxed outline-none focus:border-[color:var(--accent-soft)]"
          />
        </div>
      </section>
    </div>
  );
}
