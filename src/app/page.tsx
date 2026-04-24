"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  cryptoId,
  formatDate,
  type DailyEntry,
  type TimeLog,
  type TimeSlot,
} from "@/lib/db";
import { saveDaily, useDaily } from "@/lib/hooks";
import { DateSwitcher } from "@/components/DateSwitcher";
import { SectionLabel } from "@/components/SectionLabel";
import {
  CategoryPicker,
  TimeGrid,
  TimeSummary,
  type PaintMode,
} from "@/components/TimeGrid";
import { BudgetInput } from "@/components/BudgetInput";
import { TaskBoard } from "@/components/TaskBoard";
import { TimeLogList } from "@/components/TimeLogList";
import { IMETextarea } from "@/components/IMEInput";

export default function TodayPage() {
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [paintMode, setPaintMode] = useState<PaintMode | null>("personal");
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showAboutHint, setShowAboutHint] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("life-efficiency:seen-about");
      if (!seen) setShowAboutHint(true);
    } catch {}
  }, []);

  const entry = useDaily(date);
  const update = (next: DailyEntry) => {
    saveDaily(next);
  };

  const doneCount = entry.tasks.filter((t) => t.done && t.title.trim()).length;
  const totalCount = entry.tasks.filter((t) => t.title.trim()).length;

  const progress = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((doneCount / totalCount) * 100);
  }, [doneCount, totalCount]);

  function updateSlots(next: TimeSlot[]) {
    update({ ...entry, slots: next });
  }

  function updateTimeLogs(next: TimeLog[]) {
    update({ ...entry, timeLogs: next });
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
        {showAboutHint && (
          <Link
            href="/about"
            onClick={() => setShowAboutHint(false)}
            className="flex items-center justify-between rounded-lg border border-dashed border-[color:var(--accent-soft)] bg-[color:var(--bg-card)] px-3 py-2 text-xs text-[color:var(--fg-muted)] transition-colors hover:border-[color:var(--accent)]"
          >
            <span>
              <span className="mr-1 text-[color:var(--accent)]">✦</span>
              新手？先看一下「写在前面」与 135 原则的使用方法
            </span>
            <span className="text-[color:var(--accent)]">→</span>
          </Link>
        )}
      </div>

      {/* 135 任务看板（可拖动、跨级） */}
      <TaskBoard
        tasks={entry.tasks}
        onChange={(next) => update({ ...entry, tasks: next })}
        onAddExtra={addExtra}
      />

      {/* 随手记录 */}
      <section className="space-y-3">
        <SectionLabel>随手记录</SectionLabel>
        <div className="card">
          <IMETextarea
            value={entry.notes ?? ""}
            onChange={(v) => update({ ...entry, notes: v })}
            placeholder="贴发票、改 PPT、扫描合同……"
            rows={3}
            className="w-full resize-y bg-transparent text-sm leading-6 outline-none placeholder:text-[color:var(--fg-soft)]"
          />
        </div>
      </section>

      {/* 可支配时间预估 */}
      <section className="space-y-3">
        <SectionLabel>可支配时间预估</SectionLabel>
        <div className="card">
          <BudgetInput value={entry} onChange={update} />
        </div>
      </section>

      {/* 24 小时时间格 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>24 小时 · 时间分配</SectionLabel>
          <span className="hidden text-[11px] text-[color:var(--fg-soft)] sm:inline">
            每格 30 分钟 · 按住可拖动批量填涂
          </span>
        </div>
        <div className="card space-y-3">
          <CategoryPicker value={paintMode} onChange={setPaintMode} />
          <TimeGrid
            slots={entry.slots}
            paintMode={paintMode}
            activeSlot={activeSlot}
            onChange={updateSlots}
            onPickSlot={setActiveSlot}
          />
          <div className="divider" />
          <TimeSummary slots={entry.slots} />
        </div>
      </section>

      {/* 时间日志 */}
      <section className="space-y-3">
        <SectionLabel>今日时间日志</SectionLabel>
        <div className="card">
          <TimeLogList
            logs={entry.timeLogs ?? []}
            activeSlot={activeSlot}
            onChange={updateTimeLogs}
            onFocusSlot={setActiveSlot}
          />
        </div>
      </section>

      <p className="pt-2 text-center text-[11px] text-[color:var(--fg-soft)]">
        「我选择做」· 135 原则 · 1 大 + 3 中 + 5 小
      </p>
    </div>
  );
}
