"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayKey } from "./utils";

export interface EmotionLog {
  id: string;
  date: string;
  score: number;
  logged_at: string;
}

const MAX_PER_DAY = 3;

export function useEmotionLogs() {
  const [todayLogs, setTodayLogs] = useState<EmotionLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();
  const today = todayKey();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("emotion_logs")
      .select("id, date, score, logged_at")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("logged_at", { ascending: true });

    setTodayLogs((data as EmotionLog[]) ?? []);
    setLoaded(true);
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  async function logEmotion(score: number): Promise<boolean> {
    if (todayLogs.length >= MAX_PER_DAY) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("emotion_logs")
      .insert({ user_id: user.id, date: today, score })
      .select("id, date, score, logged_at")
      .single();

    if (error || !data) return false;
    setTodayLogs((prev) => [...prev, data as EmotionLog]);
    return true;
  }

  const latestScore = todayLogs.length > 0 ? todayLogs[todayLogs.length - 1].score : null;
  const canLogMore = todayLogs.length < MAX_PER_DAY;

  return { todayLogs, logEmotion, latestScore, canLogMore, loaded };
}
