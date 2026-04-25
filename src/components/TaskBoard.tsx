"use client";

/**
 * 135 任务拖拽看板：四个分区（big / medium / small / extra）。
 *
 * 设计原则：1 / 3 / 5 这三个固定槽位的数量绝不能因为拖动而改变。
 * 因此跨 size 的拖动一律按「swap 交换」处理——
 *   - active 接管 over 的 size 与位置；
 *   - over 反向接管 active 原本的 size 与位置。
 * 这样数量始终保持：big = 1, medium = 3, small = 5；extra 自由增减。
 *
 * 同 size 内拖动则是普通 reorder。
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

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeSize = findContainer(activeId);
    if (!activeSize) return;

    const overIsContainer = SIZES.includes(overId as Size);
    const overSize = overIsContainer
      ? (overId as Size)
      : findContainer(overId);
    if (!overSize) return;

    if (activeSize === overSize) {
      // 同容器：reorder
      const arr = grouped[activeSize];
      const fromIdx = arr.findIndex((t) => t.id === activeId);
      const toIdx = overIsContainer
        ? arr.length - 1
        : arr.findIndex((t) => t.id === overId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
      const next = [...arr];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      rebuild({ [activeSize]: next });
      return;
    }

    /**
     * 跨容器：严格 swap，保证 1/3/5 槽位数量不变。
     *
     * 落点确定：
     *  - 落到具体任务（overId 是任务 id）：与该任务交换。
     *  - 落到容器空白（overId 是 size 名）：和目标容器最后一条任务交换；
     *    如果目标容器为空（只可能是 extra），则禁止该次拖动（直接 return）。
     */
    const fromArr = grouped[activeSize];
    const toArr = grouped[overSize];
    const fromIdx = fromArr.findIndex((t) => t.id === activeId);
    if (fromIdx < 0) return;

    const toIdx = overIsContainer
      ? toArr.length - 1
      : toArr.findIndex((t) => t.id === overId);
    if (toIdx < 0) return; // 空容器，禁止跨入

    const a = fromArr[fromIdx];
    const b = toArr[toIdx];

    const newFromArr = [...fromArr];
    const newToArr = [...toArr];
    // a 接管 over 位置 + over 的 size
    newToArr[toIdx] = { ...a, size: overSize };
    // b 接管 active 原位置 + active 的 size
    newFromArr[fromIdx] = { ...b, size: activeSize };

    rebuild({ [activeSize]: newFromArr, [overSize]: newToArr });
  }

  /**
   * 用 partial 替换 grouped 中的部分桶，并按 big → medium → small → extra
   * 重新拼回总数组。
   */
  function rebuild(partial: Partial<Record<Size, Task[]>>) {
    const next: Record<Size, Task[]> = {
      big: partial.big ?? grouped.big,
      medium: partial.medium ?? grouped.medium,
      small: partial.small ?? grouped.small,
      extra: partial.extra ?? grouped.extra,
    };
    onChange([...next.big, ...next.medium, ...next.small, ...next.extra]);
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
