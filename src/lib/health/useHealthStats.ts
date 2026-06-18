"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface StatPoint {
  date: string;
  value: number | null;
}

export interface HealthStats {
  steps: StatPoint[];
  heartRate: StatPoint[];
  sleep: StatPoint[];
  calories: StatPoint[];
  protein: StatPoint[];
  emotions: StatPoint[];
  weight: StatPoint[];
  focusTime: StatPoint[];
}

function buildDateRange(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

export function useHealthStats(days: number = 30) {
  const [stats, setStats] = useState<HealthStats>({
    steps: [], heartRate: [], sleep: [], calories: [],
    protein: [], emotions: [], weight: [], focusTime: [],
  });
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const cutoff = buildDateRange(days)[0];

      const [
        { data: healthRows },
        { data: emotionRows },
        { data: weightRows },
        { data: focusRows },
      ] = await Promise.all([
        supabase
          .from("health_logs")
          .select("date, steps, food, google_fit")
          .eq("user_id", user.id)
          .gte("date", cutoff),
        supabase
          .from("emotion_logs")
          .select("date, score")
          .eq("user_id", user.id)
          .gte("date", cutoff),
        supabase
          .from("weight_logs")
          .select("date, weight_kg")
          .eq("user_id", user.id)
          .gte("date", cutoff),
        supabase
          .from("focus_sessions")
          .select("date, duration_minutes")
          .eq("user_id", user.id)
          .gte("date", cutoff),
      ]);

      if (cancelled) return;

      type HealthRow = { date: string; steps: number; food: { calories?: number; protein?: number }[]; google_fit: { heartRateBpm?: number; sleepMinutes?: number } | null };
      type EmotionRow = { date: string; score: number };
      type WeightRow = { date: string; weight_kg: number };
      type FocusRow = { date: string; duration_minutes: number };

      // Aggregate emotion per day
      const emotionByDate: Record<string, number[]> = {};
      for (const r of (emotionRows as EmotionRow[]) ?? []) {
        (emotionByDate[r.date] ??= []).push(r.score);
      }

      // Aggregate focus per day
      const focusByDate: Record<string, number> = {};
      for (const r of (focusRows as FocusRow[]) ?? []) {
        focusByDate[r.date] = (focusByDate[r.date] ?? 0) + r.duration_minutes;
      }

      const healthByDate: Record<string, HealthRow> = {};
      for (const r of (healthRows as HealthRow[]) ?? []) {
        healthByDate[r.date] = r;
      }

      const weightByDate: Record<string, number> = {};
      for (const r of (weightRows as WeightRow[]) ?? []) {
        weightByDate[r.date] = r.weight_kg;
      }

      const dates = buildDateRange(days);

      function toPoints(fn: (date: string) => number | null): StatPoint[] {
        return dates
          .map((d) => ({ date: d.slice(5), value: fn(d) }))
          .filter((p) => p.value !== null);
      }

      setStats({
        steps: toPoints((d) => healthByDate[d]?.steps ?? null),
        heartRate: toPoints((d) => healthByDate[d]?.google_fit?.heartRateBpm ?? null),
        sleep: toPoints((d) => {
          const m = healthByDate[d]?.google_fit?.sleepMinutes;
          return m != null ? Math.round(m / 60 * 10) / 10 : null;
        }),
        calories: toPoints((d) => {
          const food = healthByDate[d]?.food;
          if (!food || food.length === 0) return null;
          return food.reduce((s, f) => s + (f.calories ?? 0), 0);
        }),
        protein: toPoints((d) => {
          const food = healthByDate[d]?.food;
          if (!food || food.length === 0) return null;
          return food.reduce((s, f) => s + (f.protein ?? 0), 0);
        }),
        emotions: toPoints((d) => {
          const scores = emotionByDate[d];
          if (!scores || scores.length === 0) return null;
          return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10;
        }),
        weight: toPoints((d) => weightByDate[d] ?? null),
        focusTime: toPoints((d) => focusByDate[d] ?? null),
      });

      setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  return { stats, loaded };
}
