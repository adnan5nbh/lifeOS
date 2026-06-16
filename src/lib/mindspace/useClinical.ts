"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClinicalAssessment } from "./types";

export function useClinical() {
  const [assessments, setAssessments] = useState<ClinicalAssessment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("clinical_assessments").select("*").order("assessed_at", { ascending: false });
      if (!cancelled && data) setAssessments(data as ClinicalAssessment[]);
      if (!cancelled) setLoaded(true);
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveAssessment(type: "phq9" | "gad7", scores: number[]): Promise<ClinicalAssessment | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const total_score = scores.reduce((a, b) => a + b, 0);
    const { data } = await supabase
      .from("clinical_assessments")
      .insert({ user_id: user.id, type, scores, total_score })
      .select().single();
    if (!data) return null;
    const saved = data as ClinicalAssessment;
    setAssessments(prev => [saved, ...prev]);
    return saved;
  }

  function lastAssessment(type: "phq9" | "gad7"): ClinicalAssessment | null {
    return assessments.find(a => a.type === type) ?? null;
  }

  function isDue(type: "phq9" | "gad7"): boolean {
    const last = lastAssessment(type);
    if (!last) return true;
    return Date.now() - new Date(last.assessed_at).getTime() > 7 * 24 * 60 * 60 * 1000;
  }

  return { assessments, loaded, saveAssessment, lastAssessment, isDue };
}
