"use client";

/**
 * 135 任务拖拽看板：四个分区（big / medium / small / extra）之间可以自由
 * 拖动，拖进哪个分区就变成对应的 size，位置也按落点插入。
 *
 * 思路：每个分区本身是一个 droppable「容器」，里面放一个 SortableContext。
 * 拖动时：
 *   - 同组内：数组 reorder
 *   - 跨组：把拖动 item 从原数组移出，更新 size，插入目标数组的对应位置
 */

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import type { Task } from "@/lib/db";
import { TaskList } from "@/components/TaskList";
import { SectionLabel } from "@/components/SectionLabel";

type Size = Task["size"];
const SIZES: Size[] = ["big", "medium", "small", "extra"];

const SECTION_META: Record<
  Size,
  { title: string; symbol: string; empty: string }
> = {
  big: {
    title: "最重要的任务",
    symbol: "✦",
    empty: "今天最重要、最难、最耗时的一件事",
  },
  medium: {
    title: "三个中等任务",
    symbol: "✓",
    empty: "今天必须完成、需要一定精力的事",
  },
  small: {
    title: "五个小型任务",
    symbol: "◆",
    empty: "短时间内可轻松完成的事",
  },
  extra: {
    title: "其他 / 临时任务",
    symbol: "⋯",
    empty: "临时插入、仅记录的事项",
  },
};

export function TaskBoard({
  tasks,
  onChange,
  onAddExtra,
}: {
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
  onAddExtra: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 按 size 分桶 & 保留原顺序
  const grouped: Record<Size, Task[]> = useMemo(() => {
    const g: Record<Size, Task[]> = { big: [], medium: [], small: [], extra: [] };
    for (const t of tasks) g[t.size].push(t);
    return g;
  }, [tasks]);

  function findContainer(id: string): Size | null {
    if (SIZES.includes(id as Size)) return id as Size;
    for (const s of SIZES) {
      if (grouped[s].some((t) => t.id === id)) return s;
    }
    return null;
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    // 仅在跨容器时，先把 task.size 同步过去（视觉更顺滑）
    const { active, over } = e;
    if (!over) return;
    const from = findContainer(String(active.id));
    const to = findContainer(String(over.id));
    if (!from || !to || from === to) return;

    onChange(
      tasks.map((t) => (t.id === active.id ? { ...t, size: to } : t)),
    );
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeSize = findContainer(String(active.id));
    const overSize = findContainer(String(over.id));
    if (!activeSize || !overSize) return;

    // 计算目标数组中的落点
    const overIsContainer = SIZES.includes(String(over.id) as Size);
    // drag-over 已经把 size 改了，基于最新 tasks 重新分桶
    const latest: Record<Size, Task[]> = {
      big: [],
      medium: [],
      small: [],
      extra: [],
    };
    for (const t of tasks) latest[t.size].push(t);

    const fromArr = latest[activeSize];
    const toArr = latest[overSize];
    const fromIdx = fromArr.findIndex((t) => t.id === active.id);
    if (fromIdx < 0) return;

    // 同容器：reorder
    if (activeSize === overSize) {
      const toIdx = overIsContainer
        ? toArr.length - 1
        : toArr.findIndex((t) => t.id === over.id);
      if (toIdx < 0 || toIdx === fromIdx) return;
      const next = [...fromArr];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      latest[activeSize] = next;
    } else {
      // 跨容器：已经把 size 换了，但位置还在末尾，需要移动到 over 位置
      const moved = fromArr[fromIdx];
      const newFrom = [...fromArr];
      newFrom.splice(fromIdx, 1);
      latest[activeSize] = newFrom;

      const newTo = [...toArr];
      // 去重：drag-over 可能已经把 moved 加入 toArr 末尾
      const existingIdx = newTo.findIndex((t) => t.id === moved.id);
      if (existingIdx >= 0) newTo.splice(existingIdx, 1);
      const toIdx = overIsContainer
        ? newTo.length
        : newTo.findIndex((t) => t.id === over.id);
      newTo.splice(toIdx < 0 ? newTo.length : toIdx, 0, moved);
      latest[overSize] = newTo;
    }

    // 按 big → medium → small → extra 顺序拼回总数组
    onChange([...latest.big, ...latest.medium, ...latest.small, ...latest.extra]);
  }

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId) ?? null
    : null;

  /** 全局任务顺序：big → medium → small → extra，便于回车跳到下一条。 */
  const orderedIds = useMemo(
    () => [
      ...grouped.big.map((t) => t.id),
      ...grouped.medium.map((t) => t.id),
      ...grouped.small.map((t) => t.id),
      ...grouped.extra.map((t) => t.id),
    ],
    [grouped],
  );

  function focusById(id: string) {
    const el = document.querySelector<HTMLInputElement>(
      `input[data-task-id="${id}"]`,
    );
    if (!el) return;
    el.focus();
    // 把光标放到末尾，方便接着写
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }

  function handleEnter(currentId: string) {
    const idx = orderedIds.indexOf(currentId);
    if (idx < 0) return;
    if (idx < orderedIds.length - 1) {
      focusById(orderedIds[idx + 1]);
      return;
    }
    // 已经是最后一个：新建一条 extra，等下一帧再 focus
    onAddExtra();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const all = document.querySelectorAll<HTMLInputElement>(
          "input[data-task-id]",
        );
        const last = all[all.length - 1];
        if (last) {
          last.focus();
          const len = last.value.length;
          last.setSelectionRange(len, len);
        }
      });
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/* 双栏分配：左列 = 最重要 + 三个中等（~4 条），右列 = 五个小型 + 其他（~5 条以上），
          两列高度更接近，不会像一开始那样一个卡片极矮一个极高。 */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6">
        <div className="flex flex-col gap-6">
          {(["big", "medium"] as Size[]).map((size) => (
            <Section
              key={size}
              size={size}
              items={grouped[size]}
              onChange={(next) => {
                const rest = tasks.filter((t) => t.size !== size);
                onChange([...rest, ...next]);
              }}
              onEnter={handleEnter}
            />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          {(["small", "extra"] as Size[]).map((size) => (
            <Section
              key={size}
              size={size}
              items={grouped[size]}
              onChange={(next) => {
                const rest = tasks.filter((t) => t.size !== size);
                onChange([...rest, ...next]);
              }}
              onAddExtra={size === "extra" ? onAddExtra : undefined}
              onEnter={handleEnter}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="card bg-[color:var(--bg-card)] shadow-lg">
            <div className="flex items-center gap-2 py-1 text-[15px]">
              <span className="text-[color:var(--accent)]">
                {SECTION_META[activeTask.size].symbol}
              </span>
              <span>
                {activeTask.title || (
                  <span className="text-[color:var(--fg-soft)]">未命名任务</span>
                )}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Section({
  size,
  items,
  onChange,
  onAddExtra,
  onEnter,
}: {
  size: Size;
  items: Task[];
  onChange: (next: Task[]) => void;
  onAddExtra?: () => void;
  onEnter?: (id: string) => void;
}) {
  const meta = SECTION_META[size];
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>
          <span className="mr-1">{meta.symbol}</span>
          {meta.title}
        </SectionLabel>
        {onAddExtra && (
          <button
            type="button"
            onClick={onAddExtra}
            className="text-xs text-[color:var(--accent)] hover:underline"
          >
            + 添加
          </button>
        )}
      </div>
      <SectionDroppable id={size} items={items}>
        {items.length === 0 ? (
          <div className="text-xs text-[color:var(--fg-soft)]">{meta.empty}</div>
        ) : (
          <TaskList
            tasks={items}
            onChange={onChange}
            showEstimate={size !== "extra"}
            onEnter={onEnter}
          />
        )}
      </SectionDroppable>
    </section>
  );
}

function SectionDroppable({
  id,
  items,
  children,
}: {
  id: Size;
  items: Task[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext items={items.map((t) => t.id)}>
      <div
        ref={setNodeRef}
        className={`card min-h-[4rem] transition-colors ${
          isOver ? "border-[color:var(--accent)] bg-[color:var(--bg-card)]" : ""
        }`}
      >
        {children}
      </div>
    </SortableContext>
  );
}
