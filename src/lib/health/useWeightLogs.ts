"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayKey } from "./utils";

export interface WeightLog {
  id: string;
  date: string;
  weight_kg: number;
  logged_at: string;
}

export function useWeightLogs() {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("weight_logs")
        .select("id, date, weight_kg, logged_at")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (!cancelled) {
        setLogs((data as WeightLog[]) ?? []);
        setLoaded(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function logWeight(weightKg: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = todayKey();

    const { data } = await supabase
      .from("weight_logs")
      .upsert({ user_id: user.id, date: today, weight_kg: weightKg }, { onConflict: "user_id,date" })
      .select("id, date, weight_kg, logged_at")
      .single();

    if (data) {
      const entry = data as WeightLog;
      setLogs((prev) => {
        const without = prev.filter((l) => l.date !== today);
        return [...without, entry].sort((a, b) => a.date.localeCompare(b.date));
      });
    }
  }

  const latestWeight = logs.length > 0 ? logs[logs.length - 1] : null;

  return { logs, logWeight, latestWeight, loaded };
}
