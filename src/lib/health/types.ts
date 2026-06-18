export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "abs"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export interface SetEntry {
  reps: number;
  weight: number;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  muscle: MuscleGroup;
  sets: SetEntry[];
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  servingSize?: string;
}

export interface GoogleFitData {
  stepsFromFit?: number;
  sleepMinutes?: number;
  activeMinutes?: number;
  heartRateBpm?: number;
  syncedAt?: string;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  steps: number;
  exercises: ExerciseEntry[];
  food: FoodEntry[];
  googleFit?: GoogleFitData;
}

export interface Goals {
  stepGoal: number;
  calorieGoal: number;
  proteinGoal: number;
  sleepGoal: number; // minutes
}

export const DEFAULT_GOALS: Goals = {
  stepGoal: 8000,
  calorieGoal: 2200,
  proteinGoal: 150,
  sleepGoal: 480, // 8 hours
};

export function emptyDayLog(date: string): DayLog {
  return { date, steps: 0, exercises: [], food: [] };
}
