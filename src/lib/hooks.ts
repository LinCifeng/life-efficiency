"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  createEmptyDaily,
  db,
  EMPTY_ENERGY,
  type DailyEntry,
  type EnergyEntry,
} from "./db";

export function useDaily(date: string): DailyEntry {
  const entry = useLiveQuery(() => db.daily.get(date), [date]);
  return entry ?? createEmptyDaily(date);
}

export function useEnergy(date: string): EnergyEntry {
  const entry = useLiveQuery(() => db.energy.get(date), [date]);
  return entry ?? { date, scores: [...EMPTY_ENERGY] };
}

export function useEnergyRange(dates: string[]): EnergyEntry[] {
  const entries = useLiveQuery(
    () => db.energy.where("date").anyOf(dates).toArray(),
    [dates.join(",")],
  );
  return entries ?? [];
}

export function useDailyRange(dates: string[]): DailyEntry[] {
  const entries = useLiveQuery(
    () => db.daily.where("date").anyOf(dates).toArray(),
    [dates.join(",")],
  );
  return entries ?? [];
}

export async function saveDaily(entry: DailyEntry): Promise<void> {
  await db.daily.put(entry);
}

export async function saveEnergy(entry: EnergyEntry): Promise<void> {
  await db.energy.put(entry);
}
