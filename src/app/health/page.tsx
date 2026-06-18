"use client";

import { useEffect } from "react";
import { useHealthData } from "@/lib/health/useHealthData";
import { useEmotionLogs } from "@/lib/health/useEmotionLogs";
import { useWeightLogs } from "@/lib/health/useWeightLogs";
import { useTodayWorkout } from "@/lib/health/useTodayWorkout";
import { useFocusSessions } from "@/lib/focus/useFocusSessions";
import { FoodEntry } from "@/lib/health/types";
import CoachWidget from "@/components/health/CoachWidget";
import VitalsCard from "@/components/health/VitalsCard";
import NutritionCard from "@/components/health/NutritionCard";
import WorkoutCard from "@/components/health/WorkoutCard";
import WeightTracker from "@/components/health/WeightTracker";
import StatisticsSection from "@/components/health/StatisticsSection";
import HealthSettingsSection from "@/components/health/HealthSettingsSection";

const FIT_SYNC_KEY = "lifeos.fit.lastAutoSync";
const HEVY_SYNC_KEY = "lifeos.hevy.lastAutoSync";
const AUTO_SYNC_INTERVAL = 30 * 60 * 1000; // 30 min

function shouldSync(key: string): boolean {
  const last = localStorage.getItem(key);
  return !last || Date.now() - parseInt(last) > AUTO_SYNC_INTERVAL;
}

export default function HealthPage() {
  const { todayLog, logs, goals, setGoals, updateToday, loaded } = useHealthData();
  const emotions = useEmotionLogs();
  const weightLogs = useWeightLogs();
  const workout = useTodayWorkout();
  const focus = useFocusSessions();

  // Background auto-sync Google Fit + Hevy on page load
  useEffect(() => {
    if (shouldSync(FIT_SYNC_KEY)) {
      fetch("/api/fit/sync", { method: "POST" })
        .then((r) => r.json())
        .then((d: { ok?: boolean }) => {
          if (d.ok) localStorage.setItem(FIT_SYNC_KEY, Date.now().toString());
        })
        .catch(() => {});
    }
    if (shouldSync(HEVY_SYNC_KEY)) {
      fetch("/api/hevy/sync", { method: "POST" })
        .then((r) => r.json())
        .then((d: { ok?: boolean }) => {
          if (d.ok) localStorage.setItem(HEVY_SYNC_KEY, Date.now().toString());
        })
        .catch(() => {});
    }
  }, []);

  if (!loaded) {
    return (
      <main className="flex flex-1 items-center justify-center text-slate-500">
        Loading…
      </main>
    );
  }

  function addFood(entry: Omit<FoodEntry, "id">) {
    updateToday((log) => ({
      ...log,
      food: [...log.food, { ...entry, id: crypto.randomUUID() }],
    }));
  }

  function deleteFood(id: string) {
    updateToday((log) => ({ ...log, food: log.food.filter((f) => f.id !== id) }));
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-1 justify-center bg-slate-950">
      <main className="flex w-full max-w-2xl flex-col gap-5 px-4 py-8">
        <header>
          <h1 className="text-2xl font-bold text-slate-100">Health & Fitness</h1>
          <p className="text-sm text-slate-400">{today}</p>
        </header>

        <CoachWidget
          log={todayLog}
          goals={goals}
          emotionScore={emotions.latestScore}
        />

        <VitalsCard
          log={todayLog}
          goals={goals}
          emotionLogs={emotions.todayLogs}
          canLogEmotion={emotions.canLogMore}
          onLogEmotion={emotions.logEmotion}
        />

        <NutritionCard
          food={todayLog.food}
          calorieGoal={goals.calorieGoal}
          proteinGoal={goals.proteinGoal}
          focusMinutes={focus.totalMinutes}
          onAdd={addFood}
          onDelete={deleteFood}
        />

        <WorkoutCard
          workouts={workout.workouts}
          muscleActivity={workout.muscleActivity}
          workoutRating={workout.workoutRating}
          totalSets={workout.totalSets}
        />

        <WeightTracker
          logs={weightLogs.logs}
          latestWeight={weightLogs.latestWeight}
          onLog={weightLogs.logWeight}
        />

        <StatisticsSection />

        <HealthSettingsSection goals={goals} onGoalsChange={setGoals} />
      </main>
    </div>
  );
}
