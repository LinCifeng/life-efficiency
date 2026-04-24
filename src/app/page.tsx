"use client";

import { useState, useMemo } from "react";
import {
  cryptoId,
  formatDate,
  type DailyEntry,
  type Task,
  type TimeCategory,
  type TimeSlot,
} from "@/lib/db";
import { saveDaily, useDaily } from "@/lib/hooks";
import { DateSwitcher } from "@/components/DateSwitcher";
import { SectionLabel } from "@/components/SectionLabel";
import {
  CategoryPicker,
  TimeGrid,
  TimeSummary,
} from "@/components/TimeGrid";
import { BudgetInput } from "@/components/BudgetInput";
import { TaskList } from "@/components/TaskList";

export default function TodayPage() {
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [selectedCategory, setSelectedCategory] =
    useState<TimeCategory | null>("personal");

  const entry = useDaily(date);
  const update = (next: DailyEntry) => {
    saveDaily(next);
  };

  const big = entry.tasks.filter((t) => t.size === "big");
  const medium = entry.tasks.filter((t) => t.size === "medium");
  const small = entry.tasks.filter((t) => t.size === "small");
  const extra = entry.tasks.filter((t) => t.size === "extra");

  const doneCount = entry.tasks.filter((t) => t.done && t.title.trim()).length;
  const totalCount = entry.tasks.filter((t) => t.title.trim()).length;

  const progress = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((doneCount / totalCount) * 100);
  }, [doneCount, totalCount]);

  function updateTasksOf(size: Task["size"], next: Task[]) {
    update({
      ...entry,
      tasks: [
        ...entry.tasks.filter((t) => t.size !== size),
        ...next,
      ],
    });
  }

  function updateSlots(next: TimeSlot[]) {
    update({ ...entry, slots: next });
  }

  function addExtra() {
    update({
      ...entry,
      tasks: [
        ...entry.tasks,
        { id: cryptoId(), size: "extra", title: "", done: false },
      ],
    });
  }

  return (
    <div className="flex flex-col gap-7">
      {/* 顶部：日期 + 进度 */}
      <div className="flex flex-col gap-3">
        <DateSwitcher date={date} onChange={setDate} />
        <div className="flex items-center gap-3 text-xs text-[color:var(--fg-muted)]">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--border-soft)]">
            <div
              className="h-full rounded-full bg-[color:var(--accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="tabular-nums">
            {doneCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* 24 小时时间格 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>今日清单</SectionLabel>
          <CategoryPickerMobileHint />
        </div>
        <div className="card space-y-3">
          <CategoryPicker
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
          <TimeGrid
            slots={entry.slots}
            selectedCategory={selectedCategory}
            onChange={updateSlots}
          />
          <div className="divider" />
          <TimeSummary slots={entry.slots} />
        </div>
      </section>

      {/* 时间预算 */}
      <section className="space-y-3">
        <SectionLabel>可支配时间预估</SectionLabel>
        <div className="card">
          <BudgetInput value={entry} onChange={update} />
        </div>
      </section>

      {/* 最重要的任务 */}
      <section className="space-y-3">
        <SectionLabel>
          <span className="mr-1">✦</span>最重要的任务
        </SectionLabel>
        <div className="card">
          <TaskList
            tasks={big}
            onChange={(next) => updateTasksOf("big", next)}
          />
        </div>
      </section>

      {/* 三个中等任务 */}
      <section className="space-y-3">
        <SectionLabel>
          <span className="mr-1">✓</span>三个中等任务
        </SectionLabel>
        <div className="card">
          <TaskList
            tasks={medium}
            onChange={(next) => updateTasksOf("medium", next)}
          />
        </div>
      </section>

      {/* 五个小型任务 */}
      <section className="space-y-3">
        <SectionLabel>
          <span className="mr-1">◆</span>五个小型任务
        </SectionLabel>
        <div className="card">
          <TaskList
            tasks={small}
            onChange={(next) => updateTasksOf("small", next)}
          />
        </div>
      </section>

      {/* 其他/临时任务 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>
            <span className="mr-1">⋯</span>其他 / 临时任务
          </SectionLabel>
          <button
            type="button"
            onClick={addExtra}
            className="text-xs text-[color:var(--accent)] hover:underline"
          >
            + 添加
          </button>
        </div>
        <div className="card space-y-2">
          {extra.length === 0 ? (
            <div className="text-xs text-[color:var(--fg-soft)]">
              临时插入的、不需立即完成的、仅记录的事项
            </div>
          ) : (
            <TaskList
              tasks={extra}
              onChange={(next) => updateTasksOf("extra", next)}
              columns={{ planned: false, estimate: false }}
            />
          )}
          <div className="divider" />
          <textarea
            value={entry.notes ?? ""}
            onChange={(e) => update({ ...entry, notes: e.target.value })}
            placeholder="随手记录：贴发票、改下 PPT、扫描合同……"
            rows={2}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[color:var(--fg-soft)]"
          />
        </div>
      </section>

      <p className="pt-2 text-center text-[11px] text-[color:var(--fg-soft)]">
        「我选择做」· 135 原则 · 1 大 + 3 中 + 5 小
      </p>
    </div>
  );
}

function CategoryPickerMobileHint() {
  return (
    <span className="hidden text-[11px] text-[color:var(--fg-soft)] sm:inline">
      点击格子记录时间
    </span>
  );
}
