"use client";

import { useEffect, useState } from "react";
import { DayLog, DEFAULT_GOALS, Goals, emptyDayLog } from "./types";
import { todayKey } from "./utils";
import { createClient } from "@/lib/supabase/client";

const LOGS_KEY = "lifeos.health.logs";
const GOALS_KEY = "lifeos.health.goals";
const MIGRATED_KEY = "lifeos.health.migrated";

type LogsByDate = Record<string, DayLog>;

type LogRow = {
  date: string;
  steps: number;
  exercises: DayLog["exercises"];
  food: DayLog["food"];
};

type GoalsRow = {
  step_goal: number;
  calorie_goal: number;
  protein_goal: number;
};

function rowToLog(row: LogRow): DayLog {
  return {
    date: row.date,
    steps: row.steps,
    exercises: row.exercises ?? [],
    food: row.food ?? [],
  };
}

function rowToGoals(row: GoalsRow): Goals {
  return {
    stepGoal: row.step_goal,
    calorieGoal: row.calorie_goal,
    proteinGoal: row.protein_goal,
  };
}

export function useHealthData() {
  const [logs, setLogs] = useState<LogsByDate>({});
  const [goals, setGoalsState] = useState<Goals>(DEFAULT_GOALS);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // One-time migration of any locally-stored data into Supabase.
      if (!localStorage.getItem(MIGRATED_KEY)) {
        try {
          const rawLogs = localStorage.getItem(LOGS_KEY);
          if (rawLogs) {
            const localLogs: LogsByDate = JSON.parse(rawLogs);
            const rows = Object.values(localLogs).map((log) => ({
              user_id: user.id,
              date: log.date,
              steps: log.steps,
              exercises: log.exercises,
              food: log.food,
            }));
            if (rows.length > 0) {
              await supabase.from("health_logs").upsert(rows, { onConflict: "user_id,date" });
            }
          }

          const rawGoals = localStorage.getItem(GOALS_KEY);
          if (rawGoals) {
            const localGoals: Partial<Goals> = JSON.parse(rawGoals);
            const merged = { ...DEFAULT_GOALS, ...localGoals };
            await supabase.from("health_goals").upsert({
              user_id: user.id,
              step_goal: merged.stepGoal,
              calorie_goal: merged.calorieGoal,
              protein_goal: merged.proteinGoal,
            });
          }
        } catch {
          // ignore corrupted local storage
        }
        localStorage.setItem(MIGRATED_KEY, "1");
        localStorage.removeItem(LOGS_KEY);
        localStorage.removeItem(GOALS_KEY);
      }

      const [{ data: logRows }, { data: goalsRow }] = await Promise.all([
        supabase.from("health_logs").select("date, steps, exercises, food"),
        supabase.from("health_goals").select("step_goal, calorie_goal, protein_goal").maybeSingle(),
      ]);

      if (cancelled) return;

      if (logRows) {
        const byDate: LogsByDate = {};
        for (const row of logRows as LogRow[]) {
          byDate[row.date] = rowToLog(row);
        }
        setLogs(byDate);
      }

      if (goalsRow) {
        setGoalsState(rowToGoals(goalsRow as GoalsRow));
      } else {
        await supabase.from("health_goals").insert({
          user_id: user.id,
          step_goal: DEFAULT_GOALS.stepGoal,
          calorie_goal: DEFAULT_GOALS.calorieGoal,
          protein_goal: DEFAULT_GOALS.proteinGoal,
        });
      }

      setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = todayKey();
  const todayLog: DayLog = logs[today] ?? emptyDayLog(today);

  async function updateToday(updater: (log: DayLog) => DayLog) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const current = logs[today] ?? emptyDayLog(today);
    const next = updater(current);

    setLogs((prev) => ({ ...prev, [today]: next }));

    await supabase.from("health_logs").upsert(
      {
        user_id: user.id,
        date: next.date,
        steps: next.steps,
        exercises: next.exercises,
        food: next.food,
      },
      { onConflict: "user_id,date" }
    );
  }

  async function setGoals(newGoals: Goals) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setGoalsState(newGoals);

    await supabase.from("health_goals").upsert({
      user_id: user.id,
      step_goal: newGoals.stepGoal,
      calorie_goal: newGoals.calorieGoal,
      protein_goal: newGoals.proteinGoal,
    });
  }

  return { logs, todayLog, goals, setGoals, updateToday, loaded };
}
