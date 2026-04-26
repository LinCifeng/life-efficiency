"use client";

/**
 * 135 任务拖拽看板：四个分区（big / medium / small / extra）。
 *
 * 设计原则：1 / 3 / 5 这三个固定槽位的数量绝不能因为拖动而改变。
 *
 * big / medium / small 三档统一视为一条 9 格的优先级序列：
 *   [big, m0, m1, m2, s0, s1, s2, s3, s4]
 * 跨档拖动 = 把这条序列里的某一格拿出来再插到目标位置，中间的元素整体顺移。
 * 这条逻辑和"调整优先级"的心智一致——
 *   - 把 small 提到 big：原 big、medium 们整体降一档；
 *   - 把 big 降到 small：原 medium、small 们整体升一档。
 * 同档内拖动是这条逻辑的特例（splice 在同档区间内重排），无需特判。
 *
 * extra 区数量可变，是溢出/临时区，和三档之间继续走 swap 语义，
 * 避免被卷入"必须保持 1/3/5"的链式顺移。
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
import { useEffect, useMemo, useRef, useState } from "react";
import type { Task } from "@/lib/db";
import { TaskList } from "@/components/TaskList";
import { SectionLabel } from "@/components/SectionLabel";

type Size = Task["size"];
const SIZES: Size[] = ["big", "medium", "small", "extra"];
type FixedSize = "big" | "medium" | "small";
const FIXED_SIZES: FixedSize[] = ["big", "medium", "small"];

/** 9 格固定优先级序列在展平数组里每个 size 占据的最后一个 index。 */
const SLOT_LAST_IDX: Record<FixedSize, number> = {
  big: 0,
  medium: 3,
  small: 8,
};

/** 把展平后的 9 个 task 重新切片成 big / medium / small 三档，并刷新 size 字段。 */
function reshapeFlat(flat: Task[]): {
  big: Task[];
  medium: Task[];
  small: Task[];
} {
  return {
    big: flat.slice(0, 1).map((t) => ({ ...t, size: "big" as const })),
    medium: flat.slice(1, 4).map((t) => ({ ...t, size: "medium" as const })),
    small: flat.slice(4, 9).map((t) => ({ ...t, size: "small" as const })),
  };
}

/**
 * 基于"输入 base tasks + active/over"算出"假设松手"后的新 tasks 数组
 * （按 big → medium → small → extra 顺序拼接）。
 *
 * 拖动期间会用它实时驱动 localTasks 重排 → 出现"其他任务顺移"动画；
 * 松手时再用一次同样的算法计算最终结果并 commit 给外部 onChange。
 *
 * 跨档语义：
 *  - extra 内部 / extra ↔ 三档：swap（保持 1/3/5 数量稳定）；
 *  - big / medium / small 三档之间：链式顺移（splice 在 9 格序列里）。
 */
function computeNext(
  base: Task[],
  activeIdRaw: string | number | undefined | null,
  overIdRaw: string | number | undefined | null,
): Task[] | null {
  if (activeIdRaw == null || overIdRaw == null) return null;
  const activeId = String(activeIdRaw);
  const overId = String(overIdRaw);
  if (activeId === overId) return null;

  const grouped: Record<Size, Task[]> = {
    big: [],
    medium: [],
    small: [],
    extra: [],
  };
  for (const t of base) grouped[t.size].push(t);

  const findContainer = (id: string): Size | null => {
    if (SIZES.includes(id as Size)) return id as Size;
    for (const s of SIZES) {
      if (grouped[s].some((t) => t.id === id)) return s;
    }
    return null;
  };

  const activeSize = findContainer(activeId);
  if (!activeSize) return null;
  const overIsContainer = SIZES.includes(overId as Size);
  const overSize = overIsContainer
    ? (overId as Size)
    : findContainer(overId);
  if (!overSize) return null;

  const concat = (g: Record<Size, Task[]>) => [
    ...g.big,
    ...g.medium,
    ...g.small,
    ...g.extra,
  ];

  // 1) extra 内部 reorder
  if (activeSize === "extra" && overSize === "extra") {
    const arr = grouped.extra;
    const fromIdx = arr.findIndex((t) => t.id === activeId);
    const toIdx = overIsContainer
      ? arr.length - 1
      : arr.findIndex((t) => t.id === overId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return null;
    const next = [...arr];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    return concat({ ...grouped, extra: next });
  }

  // 2) 涉及 extra 的跨档：swap
  if (activeSize === "extra" || overSize === "extra") {
    const fromArr = grouped[activeSize];
    const toArr = grouped[overSize];
    const fromIdx = fromArr.findIndex((t) => t.id === activeId);
    if (fromIdx < 0) return null;
    const toIdx = overIsContainer
      ? toArr.length - 1
      : toArr.findIndex((t) => t.id === overId);
    if (toIdx < 0) return null;
    const a = fromArr[fromIdx];
    const b = toArr[toIdx];
    const newFromArr = [...fromArr];
    const newToArr = [...toArr];
    newToArr[toIdx] = { ...a, size: overSize };
    newFromArr[fromIdx] = { ...b, size: activeSize };
    return concat({
      ...grouped,
      [activeSize]: newFromArr,
      [overSize]: newToArr,
    });
  }

  // 3) big / medium / small 三档：链式顺移（9 格序列上的 splice）
  const flat: Task[] = [
    ...grouped.big,
    ...grouped.medium,
    ...grouped.small,
  ];
  const fromIdx = flat.findIndex((t) => t.id === activeId);
  if (fromIdx < 0) return null;
  const toIdx = overIsContainer
    ? SLOT_LAST_IDX[overSize as FixedSize]
    : flat.findIndex((t) => t.id === overId);
  if (toIdx < 0 || fromIdx === toIdx) return null;
  const next = [...flat];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  const reshaped = reshapeFlat(next);
  return concat({ ...grouped, ...reshaped });
}

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

  /**
   * 拖动期间的本地视图。dnd-kit 多容器拖动要在 onDragOver 实时
   * 改 state 让 DOM 顺序立即变化，被挤的任务才会自然出现 transform 动画
   * （也就是用户要的"其他条目移动有动画"）。
   *
   * - 没在拖动时：localTasks 跟 props.tasks 同步；
   * - 拖动中：localTasks 是"假设松手后"的预演；
   * - 松手时：用同样的算法再算一遍，commit 给外部 onChange。
   *
   * dragBaseRef 记录 dragstart 时的 tasks 快照，作为 computeNext 的输入；
   * 这样 onDragOver 不会基于上一帧已经 reorder 的 localTasks 反复 splice。
   */
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const dragBaseRef = useRef<Task[] | null>(null);

  useEffect(() => {
    if (dragBaseRef.current == null) setLocalTasks(tasks);
  }, [tasks]);

  const displayedTasks = dragBaseRef.current ? localTasks : tasks;

  // 按 size 分桶 & 保留原顺序
  const grouped: Record<Size, Task[]> = useMemo(() => {
    const g: Record<Size, Task[]> = { big: [], medium: [], small: [], extra: [] };
    for (const t of displayedTasks) g[t.size].push(t);
    return g;
  }, [displayedTasks]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    dragBaseRef.current = tasks;
    setLocalTasks(tasks);
  }

  function handleDragOver(e: DragOverEvent) {
    if (!dragBaseRef.current) return;
    const next = computeNext(
      dragBaseRef.current,
      e.active.id,
      e.over?.id ?? null,
    );
    if (next) setLocalTasks(next);
  }

  function handleDragEnd(e: DragEndEvent) {
    const base = dragBaseRef.current;
    dragBaseRef.current = null;
    setActiveId(null);
    if (!base) return;
    const next = computeNext(base, e.active.id, e.over?.id ?? null);
    if (next) {
      setLocalTasks(next);
      onChange(next);
    } else {
      // 没有有效目标 → 还原
      setLocalTasks(tasks);
    }
  }

  function handleDragCancel() {
    const base = dragBaseRef.current;
    dragBaseRef.current = null;
    setActiveId(null);
    setLocalTasks(base ?? tasks);
  }

  const activeTask = activeId
    ? displayedTasks.find((t) => t.id === activeId) ?? null
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
      onDragCancel={handleDragCancel}
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
