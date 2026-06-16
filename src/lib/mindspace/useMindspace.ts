"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DailyCheckin } from "./types";

export function useMindspace() {
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("mindspace_checkins").select("*").order("date", { ascending: false });
      if (!cancelled && data) setCheckins(data as DailyCheckin[]);
      if (!cancelled) setLoaded(true);
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveCheckin(checkin: Omit<DailyCheckin, "id" | "created_at">): Promise<DailyCheckin | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("mindspace_checkins")
      .upsert({ ...checkin, user_id: user.id }, { onConflict: "user_id,date" })
      .select().single();
    if (!data) return null;
    const saved = data as DailyCheckin;
    setCheckins(prev => {
      const idx = prev.findIndex(c => c.date === saved.date);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    return saved;
  }

  function checkinForDate(date: string): DailyCheckin | null {
    return checkins.find(c => c.date === date) ?? null;
  }

  return { checkins, loaded, saveCheckin, checkinForDate };
}
