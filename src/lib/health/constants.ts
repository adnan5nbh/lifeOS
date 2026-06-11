import { MuscleGroup } from "./types";

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  abs: "Abs",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
};

export const MUSCLE_GROUPS: MuscleGroup[] = Object.keys(
  MUSCLE_LABELS
) as MuscleGroup[];

export const EXERCISE_PRESETS: { name: string; muscle: MuscleGroup }[] = [
  { name: "Bench Press", muscle: "chest" },
  { name: "Incline Dumbbell Press", muscle: "chest" },
  { name: "Push-up", muscle: "chest" },
  { name: "Pull-up", muscle: "back" },
  { name: "Lat Pulldown", muscle: "back" },
  { name: "Bent-over Row", muscle: "back" },
  { name: "Overhead Press", muscle: "shoulders" },
  { name: "Lateral Raise", muscle: "shoulders" },
  { name: "Bicep Curl", muscle: "biceps" },
  { name: "Hammer Curl", muscle: "biceps" },
  { name: "Tricep Extension", muscle: "triceps" },
  { name: "Tricep Pushdown", muscle: "triceps" },
  { name: "Plank", muscle: "abs" },
  { name: "Crunch", muscle: "abs" },
  { name: "Squat", muscle: "quads" },
  { name: "Leg Press", muscle: "quads" },
  { name: "Lunge", muscle: "quads" },
  { name: "Romanian Deadlift", muscle: "hamstrings" },
  { name: "Leg Curl", muscle: "hamstrings" },
  { name: "Hip Thrust", muscle: "glutes" },
  { name: "Glute Bridge", muscle: "glutes" },
  { name: "Calf Raise", muscle: "calves" },
];
