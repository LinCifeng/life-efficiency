"use client";

import { useState, useMemo, useEffect } from "react";
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
import { saveDaily } from "@/lib/hooks";
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

  // Today 页放弃 useLiveQuery，改用本地 useState + functional setEntry。
  // 原因：useLiveQuery 在 React 同一事件 batch 里的中间渲染会把 entryRef 又
  // 同步回旧 entry，造成"点格子时同步触发的 setSlots 和 setTimeLogs 互相覆盖"，
  // 现象就是第一次点击只创建了日志、格子没涂色（或者反过来）。
  // 改成本地 state 后，applyUpdate 用 setEntry(prev => mutator(prev))，
  // React 自身保证多个 functional update 串行作用在最新值上，互不吞数据。
  const [entry, setEntry] = useState<DailyEntry>(() => createEmptyDaily(date));

  /**
   * date 变化时：从 IndexedDB 加载该日 entry，并承担"顺移昨日未完成任务"的责任。
   *
   *  - 仅当当前 date 是真"今天"时执行顺移；翻看历史日不会触发；
   *  - 通过 entry.carriedFromDate 字段去重，每个昨日最多顺移一次；
   *  - 优先填进今天对应 size 的"空槽位"（标题为空），保持 1 / 3 / 5 结构；
   *  - 没有空槽位时进 extra 区域。
   */
  useEffect(() => {
    let cancelled = false;
    setEntry(createEmptyDaily(date));
    (async () => {
      const today = formatDate(new Date());
      const t = (await db.daily.get(date)) ?? createEmptyDaily(date);
      if (cancelled) return;

      if (date !== today) {
        setEntry(t);
        return;
      }

      const yesterday = addDays(today, -1);
      if (t.carriedFromDate === yesterday) {
        setEntry(t);
        return;
      }

      const yEntry = await db.daily.get(yesterday);
      if (cancelled) return;

      let next: DailyEntry = { ...t, carriedFromDate: yesterday };
      if (yEntry) {
        const unchecked = yEntry.tasks.filter(
          (x) => !x.done && x.title.trim(),
        );
        if (unchecked.length > 0) {
          const nextTasks = [...t.tasks];
          for (const tk of unchecked) {
            const slotIdx = nextTasks.findIndex(
              (x) => x.size === tk.size && !x.title.trim() && !x.done,
            );
            const cloned: Task = {
              id: cryptoId(),
              size: tk.size,
              title: tk.title,
              done: false,
            };
            if (slotIdx >= 0) nextTasks[slotIdx] = cloned;
            else nextTasks.push({ ...cloned, size: "extra" });
          }
          next = { ...next, tasks: nextTasks };
        }
      }

      if (cancelled) return;
      setEntry(next);
      saveDaily(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const applyUpdate = (mutator: (prev: DailyEntry) => DailyEntry) => {
    setEntry((prev) => {
      const next = mutator(prev);
      saveDaily(next);
      return next;
    });
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
