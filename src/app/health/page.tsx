"use client";

import { useEffect } from "react";
import { useHealthData } from "@/lib/health/useHealthData";
import { ExerciseEntry, FoodEntry } from "@/lib/health/types";
import DailySummary from "@/components/health/DailySummary";
import WorkoutTracker from "@/components/health/WorkoutTracker";
import FoodLogger from "@/components/health/FoodLogger";
import ProgressGraphs from "@/components/health/ProgressGraphs";
import GoalsPanel from "@/components/health/GoalsPanel";
import GoogleFitPanel from "@/components/health/GoogleFitPanel";

const HEVY_AUTO_SYNC_KEY = "lifeos.hevy.lastAutoSync";
const HEVY_AUTO_SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes

function useHevyAutoSync() {
  useEffect(() => {
    const last = localStorage.getItem(HEVY_AUTO_SYNC_KEY);
    const shouldSync = !last || Date.now() - parseInt(last) > HEVY_AUTO_SYNC_INTERVAL;
    if (!shouldSync) return;

    fetch("/api/hevy/sync", { method: "POST" })
      .then((r) => r.json())
      .then((d: { ok?: boolean }) => {
        if (d.ok) localStorage.setItem(HEVY_AUTO_SYNC_KEY, Date.now().toString());
      })
      .catch(() => {});
  }, []);
}

export default function HealthPage() {
  const { logs, todayLog, goals, setGoals, updateToday, loaded } = useHealthData();
  useHevyAutoSync();

  if (!loaded) {
    return (
      <main className="flex flex-1 items-center justify-center text-slate-500">
        Loading…
      </main>
    );
  }

  function setSteps(steps: number) {
    updateToday((log) => ({ ...log, steps }));
  }

  function addExercise(exercise: Omit<ExerciseEntry, "id">) {
    updateToday((log) => ({
      ...log,
      exercises: [...log.exercises, { ...exercise, id: crypto.randomUUID() }],
    }));
  }

  function deleteExercise(id: string) {
    updateToday((log) => ({
      ...log,
      exercises: log.exercises.filter((e) => e.id !== id),
    }));
  }

  function addFood(entry: Omit<FoodEntry, "id">) {
    updateToday((log) => ({
      ...log,
      food: [...log.food, { ...entry, id: crypto.randomUUID() }],
    }));
  }

  function deleteFood(id: string) {
    updateToday((log) => ({
      ...log,
      food: log.food.filter((f) => f.id !== id),
    }));
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-1 justify-center bg-slate-950">
      <main className="flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
        <header>
          <h1 className="text-2xl font-bold text-slate-100">Health & Fitness</h1>
          <p className="text-sm text-slate-400">{today}</p>
        </header>

        <DailySummary log={todayLog} goals={goals} onStepsChange={setSteps} />

        {todayLog.googleFit && <GoogleFitPanel data={todayLog.googleFit} />}

        <WorkoutTracker
          exercises={todayLog.exercises}
          onAdd={addExercise}
          onDelete={deleteExercise}
        />

        <FoodLogger
          food={todayLog.food}
          calorieGoal={goals.calorieGoal}
          onAdd={addFood}
          onDelete={deleteFood}
        />

        <ProgressGraphs logs={logs} goals={goals} />

        <GoalsPanel goals={goals} onChange={setGoals} />
      </main>
    </div>
  );
}
