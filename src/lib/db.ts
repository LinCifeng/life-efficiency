import Dexie, { type EntityTable } from "dexie";

// ─────────────────────────────────────────────────────────
// 数据模型
// 所有日期统一使用 YYYY-MM-DD 字符串作为业务主键，便于按日查询、导入导出
// ─────────────────────────────────────────────────────────

export type TimeCategory = "personal" | "work" | "family" | "unavailable";

export const TIME_CATEGORY_META: Record<
  TimeCategory,
  { symbol: string; label: string; color: string }
> = {
  personal: { symbol: "☆", label: "个人", color: "#c8b894" },
  work: { symbol: "○", label: "工作", color: "#7a9269" },
  family: { symbol: "△", label: "家人朋友", color: "#b97466" },
  unavailable: { symbol: "·", label: "不可支配", color: "#a79d8e" },
};

// 24 小时 × 2 格（每半小时 1 格），共 48 格；null 代表未记录
export type TimeSlot = TimeCategory | null;

export type TaskSize = "big" | "medium" | "small" | "extra";

export interface Task {
  id: string;
  size: TaskSize;
  title: string;
  plannedAt?: string; // "09:00-11:00"
  estimateMin?: number; // 预计分钟数
  actualMin?: number; // 实际分钟数
  done: boolean;
}

export interface TimeLog {
  id: string;
  slotIndex: number; // 0~47，对应半小时格
  text: string;
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD，主键
  slots: TimeSlot[]; // 长度 48
  totalBudgetHours?: number; // 时间总预算
  budget: {
    personal?: number; // 小时
    work?: number;
    family?: number;
  };
  tasks: Task[]; // 1 big + 3 medium + 5 small + N extra
  notes?: string; // 其他/临时任务
  timeLogs?: TimeLog[]; // 每半小时做了什么的记录
}

export interface EnergyEntry {
  date: string; // YYYY-MM-DD，主键
  // 24 个点，代表 0~23 每个整点的精力打分（1~10）；null 代表未记录
  scores: Array<number | null>;
}

export interface ReflectionEntry {
  // 每 4 周一条、年度一条；id 形如 "week-2026-W17-W20" / "year-2026"
  id: string;
  kind: "month" | "year";
  rangeLabel: string; // "2026-04 第 17~20 周" / "2026 年度"
  personalGrowth?: string;
  workEfficiency?: string;
  relationship?: string;
  wishes?: string;
  updatedAt: number;
}

class LifeEfficiencyDB extends Dexie {
  daily!: EntityTable<DailyEntry, "date">;
  energy!: EntityTable<EnergyEntry, "date">;
  reflections!: EntityTable<ReflectionEntry, "id">;

  constructor() {
    super("life-efficiency");
    this.version(1).stores({
      daily: "date",
      energy: "date",
      reflections: "id, kind",
    });
  }
}

export const db = new LifeEfficiencyDB();

// ─────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────

export const EMPTY_SLOTS: TimeSlot[] = Array(48).fill(null);
export const EMPTY_ENERGY: Array<number | null> = Array(24).fill(null);

export function createEmptyDaily(date: string): DailyEntry {
  return {
    date,
    slots: [...EMPTY_SLOTS],
    budget: {},
    tasks: [
      { id: cryptoId(), size: "big", title: "", done: false },
      ...Array.from({ length: 3 }, () => ({
        id: cryptoId(),
        size: "medium" as const,
        title: "",
        done: false,
      })),
      ...Array.from({ length: 5 }, () => ({
        id: cryptoId(),
        size: "small" as const,
        title: "",
        done: false,
      })),
    ],
    notes: "",
  };
}

export function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: string, days: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// ─────────────────────────────────────────────────────────
// 导入 / 导出
// ─────────────────────────────────────────────────────────

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  daily: DailyEntry[];
  energy: EnergyEntry[];
  reflections: ReflectionEntry[];
}

export async function exportAll(): Promise<ExportPayload> {
  const [daily, energy, reflections] = await Promise.all([
    db.daily.toArray(),
    db.energy.toArray(),
    db.reflections.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    daily,
    energy,
    reflections,
  };
}

export async function importAll(
  payload: ExportPayload,
  mode: "merge" | "replace" = "merge",
): Promise<void> {
  if (payload.version !== 1) throw new Error("不支持的数据版本");
  await db.transaction("rw", [db.daily, db.energy, db.reflections], async () => {
    if (mode === "replace") {
      await Promise.all([db.daily.clear(), db.energy.clear(), db.reflections.clear()]);
    }
    await db.daily.bulkPut(payload.daily);
    await db.energy.bulkPut(payload.energy);
    await db.reflections.bulkPut(payload.reflections);
  });
}
