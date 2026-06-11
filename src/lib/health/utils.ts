import { DayLog } from "./types";

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** Returns the last `days` date keys, oldest first, ending today. */
export function lastNDays(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
}

export function shortLabel(key: string): string {
  const [, m, d] = key.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function totalCalories(log: DayLog): number {
  return log.food.reduce((sum, f) => sum + f.calories, 0);
}

export function totalProtein(log: DayLog): number {
  return log.food.reduce((sum, f) => sum + f.protein, 0);
}

/** Total weight lifted (reps x weight, summed over all sets). */
export function totalVolume(log: DayLog): number {
  return log.exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
    0
  );
}
