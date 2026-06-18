"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayKey } from "@/lib/health/utils";

export interface FocusSession {
  id: string;
  date: string;
  duration_minutes: number;
  label: string | null;
  started_at: string;
}

export function useFocusSessions(date?: string) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();
  const targetDate = date ?? todayKey();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("focus_sessions")
      .select("id, date, duration_minutes, label, started_at")
      .eq("user_id", user.id)
      .eq("date", targetDate)
      .order("started_at", { ascending: true });

    setSessions((data as FocusSession[]) ?? []);
    setLoaded(true);
  }, [targetDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  async function addSession(durationMinutes: number, label?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("focus_sessions")
      .insert({
        user_id: user.id,
        date: targetDate,
        duration_minutes: durationMinutes,
        label: label ?? null,
      })
      .select("id, date, duration_minutes, label, started_at")
      .single();

    if (data) setSessions((prev) => [...prev, data as FocusSession]);
  }

  async function deleteSession(id: string): Promise<void> {
    await supabase.from("focus_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  return { sessions, addSession, deleteSession, totalMinutes, loaded, reload: load };
}
