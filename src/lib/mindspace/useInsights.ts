"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CorrelationInsight } from "./types";

export function useInsights() {
  const [insights, setInsights] = useState<CorrelationInsight[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("correlation_insights").select("*")
        .order("created_at", { ascending: false }).limit(20);
      if (!cancelled && data) setInsights(data as CorrelationInsight[]);
      if (!cancelled) setLoaded(true);
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateInsights(): Promise<void> {
    setGenerating(true);
    try {
      const res = await fetch("/api/mindspace/insights", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.insights) setInsights(prev => [...(data.insights as CorrelationInsight[]), ...prev]);
    } finally {
      setGenerating(false);
    }
  }

  async function reactToInsight(id: string, reaction: "makes_sense" | "surprising"): Promise<void> {
    await supabase.from("correlation_insights").update({ reaction }).eq("id", id);
    setInsights(prev => prev.map(i => i.id === id ? { ...i, reaction } : i));
  }

  return { insights, loaded, generating, generateInsights, reactToInsight };
}
