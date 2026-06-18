"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayKey } from "./utils";
import { MuscleGroup } from "./types";

export interface WorkoutExercise {
  name: string;
  muscle: MuscleGroup;
  sets: { reps: number; weight_kg: number; set_type?: string }[];
}

export interface TodayWorkout {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  exercises: WorkoutExercise[];
}

export interface MuscleActivityEntry {
  sets: number;
  exercises: string[];
}

export function useTodayWorkout() {
  const [workouts, setWorkouts] = useState<TodayWorkout[]>([]);
  const [muscleActivity, setMuscleActivity] = useState<Partial<Record<MuscleGroup, MuscleActivityEntry>>>({});
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("hevy_workouts")
        .select("id, title, date, start_time, end_time, duration_seconds, exercises")
        .eq("user_id", user.id)
        .eq("date", todayKey());

      if (cancelled) return;

      const ws = (data as TodayWorkout[]) ?? [];
      setWorkouts(ws);

      const activity: Partial<Record<MuscleGroup, MuscleActivityEntry>> = {};
      for (const w of ws) {
        for (const ex of w.exercises) {
          const prev = activity[ex.muscle] ?? { sets: 0, exercises: [] };
          activity[ex.muscle] = {
            sets: prev.sets + ex.sets.length,
            exercises: prev.exercises.includes(ex.name)
              ? prev.exercises
              : [...prev.exercises, ex.name],
          };
        }
      }
      setMuscleActivity(activity);
      setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSets = Object.values(muscleActivity).reduce((s, v) => s + (v?.sets ?? 0), 0);
  const distinctMuscles = Object.keys(muscleActivity).length;
  const workoutRating = workouts.length === 0 ? 0 :
    Math.min(10, Math.round((totalSets / 25) * 7 + (distinctMuscles / 7) * 3));

  return { workouts, muscleActivity, totalSets, distinctMuscles, workoutRating, loaded };
}
