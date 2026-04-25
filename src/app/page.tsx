"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  addDays,
  createEmptyDaily,
  cryptoId,
  db,
  formatDate,
  type DailyEntry,
  type Task,
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
import { TaskBoard } from "@/components/TaskBoard";
import { TimeLogList } from "@/components/TimeLogList";
import { DailyReview } from "@/components/DailyReview";

export default function TodayPage() {
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [paintMode, setPaintMode] = useState<PaintMode | null>("personal");
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const entry = useDaily(date);
  // entryRef 始终指向"我们刚写过的最新 entry"，避免在同一次事件里多次同步调用
  // update 时，每次都从渲染闭包里拿到旧 entry → 互相覆盖（典型表现：选了类别后
  // 点格子，第一个格子涂色和创建空日志同步发生，后写完的把先写完的字段覆盖掉，
  // 表现为格子没涂色 / 日志没出现）。
  const entryRef = useRef(entry);
  entryRef.current = entry;

  const applyUpdate = (mutator: (prev: DailyEntry) => DailyEntry) => {
    const next = mutator(entryRef.current);
    entryRef.current = next;
    saveDaily(next);
  };

  // 切换涂色类别 / 进入擦除 / 取消选择时，关掉当前的"日志聚焦"目标。
  // - 进入擦除：用户的本意是清色，不希望日志区还高亮某条。
  // - 取消类别：等同"我现在不想编辑日志了"。
  // 真正的 input.blur() 在 TimeLogList 里监听 activeSlot=null 完成。
  useEffect(() => {
    if (paintMode === "erase" || paintMode == null) {
      setActiveSlot(null);
    }
  }, [paintMode]);

  /**
   * 顺移昨日未完成任务到今日。
   *
   * 规则：
   *  - 仅当当前 date 是真"今天"时执行；翻看历史日不会触发顺移；
   *  - 通过 today 的 entry.carriedFromDate 字段去重，每个昨日最多顺移一次；
   *  - 优先填进今天对应 size 的"空槽位"（标题为空），保持 1 / 3 / 5 结构；
   *  - 没有空槽位时，进 extra 区域，extra 数量可变。
   */
  const carryAttemptedRef = useRef<string | null>(null);
  useEffect(() => {
    const today = formatDate(new Date());
    if (date !== today) return;
    if (carryAttemptedRef.current === today) return;
    carryAttemptedRef.current = today;

    const yesterday = addDays(today, -1);
    let cancelled = false;

    (async () => {
      const tEntry = await db.daily.get(today);
      if (cancelled) return;
      if (tEntry?.carriedFromDate === yesterday) return;

      const yEntry = await db.daily.get(yesterday);
      if (cancelled) return;

      const base: DailyEntry =
        (await db.daily.get(today)) ?? createEmptyDaily(today);
      if (cancelled) return;

      if (!yEntry) {
        await saveDaily({ ...base, carriedFromDate: yesterday });
        return;
      }

      const unchecked = yEntry.tasks.filter(
        (t) => !t.done && t.title.trim(),
      );
      if (unchecked.length === 0) {
        await saveDaily({ ...base, carriedFromDate: yesterday });
        return;
      }

      const nextTasks = [...base.tasks];
      for (const t of unchecked) {
        const slotIdx = nextTasks.findIndex(
          (x) => x.size === t.size && !x.title.trim() && !x.done,
        );
        const cloned: Task = {
          id: cryptoId(),
          size: t.size,
          title: t.title,
          done: false,
        };
        if (slotIdx >= 0) {
          nextTasks[slotIdx] = cloned;
        } else {
          nextTasks.push({ ...cloned, size: "extra" });
        }
      }

      await saveDaily({
        ...base,
        tasks: nextTasks,
        carriedFromDate: yesterday,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [date]);

  const doneCount = entry.tasks.filter((t) => t.done && t.title.trim()).length;
  const totalCount = entry.tasks.filter((t) => t.title.trim()).length;

  const progress = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((doneCount / totalCount) * 100);
  }, [doneCount, totalCount]);

  function updateSlots(next: TimeSlot[]) {
    applyUpdate((prev) => ({ ...prev, slots: next }));
  }

  function updateTimeLogs(next: TimeLog[]) {
    applyUpdate((prev) => ({ ...prev, timeLogs: next }));
  }

  function addExtra() {
    applyUpdate((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        { id: cryptoId(), size: "extra", title: "", done: false },
      ],
    }));
  }

  return (
    <div className="flex flex-col gap-7">
      {/* 顶部座右铭：把「写在前面」最核心的句子常驻在最最顶上 */}
      <Link
        href="/about"
        className="group block border-l-2 border-[color:var(--accent-soft)] py-1 pl-3 transition-colors hover:border-[color:var(--accent)]"
      >
        <div className="text-[15px] font-medium tracking-wide text-[color:var(--fg)]">
          「我选择做」
        </div>
        <div className="mt-0.5 text-[12px] leading-relaxed text-[color:var(--fg-muted)] group-hover:text-[color:var(--fg)]">
          时间是一种有限的资源——把它投给真正重要的事，
          以自己喜欢的方式过一生。
        </div>
      </Link>

      {/* 头部：日期（大字） + 进度 + 写在前面入口 */}
      <div className="flex flex-col gap-4">
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
          <Link
            href="/about"
            className="whitespace-nowrap text-[11px] text-[color:var(--fg-soft)] transition-colors hover:text-[color:var(--accent)]"
            title="写在前面 · 135 原则"
          >
            写在前面 →
          </Link>
        </div>
      </div>

      {/* 135 任务看板（可拖动、跨级） */}
      <TaskBoard
        tasks={entry.tasks}
        onChange={(next) => applyUpdate((prev) => ({ ...prev, tasks: next }))}
        onAddExtra={addExtra}
      />

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

      {/* 每日复盘 */}
      <section className="space-y-3">
        <SectionLabel>每日复盘</SectionLabel>
        <div className="card">
          <DailyReview
            value={entry.review ?? {}}
            onChange={(reviewNext) =>
              applyUpdate((prev) => ({ ...prev, review: reviewNext }))
            }
          />
        </div>
      </section>

      <p className="pt-2 text-center text-[11px] text-[color:var(--fg-soft)]">
        「我选择做」· 135 原则 · 1 大 + 3 中 + 5 小
      </p>
    </div>
  );
}
