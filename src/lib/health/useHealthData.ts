"use client";

import { useEffect, useState } from "react";
import { DayLog, DEFAULT_GOALS, Goals, emptyDayLog } from "./types";
import { todayKey } from "./utils";

const LOGS_KEY = "lifeos.health.logs";
const GOALS_KEY = "lifeos.health.goals";

type LogsByDate = Record<string, DayLog>;

export function useHealthData() {
  const [logs, setLogs] = useState<LogsByDate>({});
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [loaded, setLoaded] = useState(false);

  // Load saved data once, on first render in the browser.
  useEffect(() => {
    try {
      const rawLogs = localStorage.getItem(LOGS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (rawLogs) setLogs(JSON.parse(rawLogs));
      const rawGoals = localStorage.getItem(GOALS_KEY);
      if (rawGoals) setGoals({ ...DEFAULT_GOALS, ...JSON.parse(rawGoals) });
    } catch {
      // ignore corrupted storage
    }
    setLoaded(true);
  }, []);

  // Save whenever data changes (after the initial load).
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }, [logs, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }, [goals, loaded]);

  const today = todayKey();
  const todayLog: DayLog = logs[today] ?? emptyDayLog(today);

  function updateToday(updater: (log: DayLog) => DayLog) {
    setLogs((prev) => {
      const current = prev[today] ?? emptyDayLog(today);
      return { ...prev, [today]: updater(current) };
    });
  }

  return { logs, todayLog, goals, setGoals, updateToday, loaded };
}
