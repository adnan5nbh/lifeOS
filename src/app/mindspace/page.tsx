"use client";

import { useMindspace } from "@/lib/mindspace/useMindspace";
import { useClinical } from "@/lib/mindspace/useClinical";
import { useInsights } from "@/lib/mindspace/useInsights";
import { useHealthData } from "@/lib/health/useHealthData";
import { useJournal } from "@/lib/notes/useJournal";
import { todayKey } from "@/lib/health/utils";
import DailyCheckIn from "@/components/mindspace/DailyCheckIn";
import ClinicalAssessments from "@/components/mindspace/ClinicalAssessments";
import EmotionTimeline from "@/components/mindspace/EmotionTimeline";
import NeuroplasticityTracker from "@/components/mindspace/NeuroplasticityTracker";
import CorrelationsPanel from "@/components/mindspace/CorrelationsPanel";
import { DailyCheckin } from "@/lib/mindspace/types";

export default function MindSpacePage() {
  const { checkins, loaded, saveCheckin, checkinForDate } = useMindspace();
  const clinical = useClinical();
  const insights = useInsights();
  const { logs } = useHealthData();
  const { entries } = useJournal();
  const today = todayKey();

  async function handleSave(data: Omit<DailyCheckin, "id" | "created_at">) {
    await saveCheckin(data);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-100">MindSpace</h1>
        <p className="text-sm text-slate-500">Emotional intelligence & psychological wellbeing</p>
      </div>

      {!loaded ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (
        <div className="flex flex-col gap-6">
          <DailyCheckIn
            date={today}
            existing={checkinForDate(today)}
            onSave={handleSave}
          />

          <EmotionTimeline checkins={checkins} />

          <NeuroplasticityTracker checkins={checkins} logs={logs} entries={entries} />

          <ClinicalAssessments
            assessments={clinical.assessments}
            isDue={clinical.isDue}
            onSave={clinical.saveAssessment}
          />

          <CorrelationsPanel
            insights={insights.insights}
            loading={!insights.loaded}
            generating={insights.generating}
            onGenerate={insights.generateInsights}
            onReact={insights.reactToInsight}
          />
        </div>
      )}
    </main>
  );
}
