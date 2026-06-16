"use client";

import { DailyCheckin } from "@/lib/mindspace/types";
import { DayLog } from "@/lib/health/types";
import { JournalEntry } from "@/lib/notes/types";

interface Props {
  checkins: DailyCheckin[];
  logs: Record<string, DayLog>;
  entries: JournalEntry[];
}

function scoreBar(score: number, color: string) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

export default function NeuroplasticityTracker({ checkins, logs, entries }: Props) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const weekKey = cutoff.toISOString().slice(0, 10);

  const weekLogs = Object.values(logs).filter(l => l.date >= weekKey);
  const weekCheckins = checkins.filter(c => c.date >= weekKey);
  const weekEntries = entries.filter(e => e.createdAt >= weekKey + "T00:00:00");

  // Exercise: days with at least one exercise this week / 5 goal
  const exerciseDays = weekLogs.filter(l => l.exercises.length > 0).length;
  const exerciseScore = Math.min(100, (exerciseDays / 5) * 100);

  // Creative output: journal entries written this week / 7 goal
  const journalScore = Math.min(100, (weekEntries.length / 7) * 100);

  // Mental clarity: average (10 - cognitive_load) / 10
  const clarityScore = weekCheckins.length > 0
    ? (weekCheckins.reduce((s, c) => s + (10 - c.cognitive_load), 0) / weekCheckins.length / 10) * 100
    : 50;

  // Positive ratio from check-ins
  const positiveRatio = weekCheckins.length > 0
    ? (weekCheckins.filter(c => c.valence > 0).length / weekCheckins.length) * 100
    : 50;

  // Steps average vs 8000 goal
  const avgSteps = weekLogs.length > 0
    ? weekLogs.reduce((s, l) => s + l.steps, 0) / weekLogs.length : 0;
  const stepsScore = Math.min(100, (avgSteps / 8000) * 100);

  const brainHealthScore = Math.round(
    exerciseScore * 0.30 + journalScore * 0.20 + clarityScore * 0.20 + positiveRatio * 0.15 + stepsScore * 0.15
  );

  const level = brainHealthScore >= 80 ? { label: "Thriving", color: "#22c55e" }
    : brainHealthScore >= 60 ? { label: "Growing", color: "#6366f1" }
    : brainHealthScore >= 40 ? { label: "Maintaining", color: "#eab308" }
    : { label: "Recovering", color: "#f97316" };

  const tips = [
    exerciseScore < 60 && "Try to get 5 exercise sessions this week — even 20-min walks count.",
    journalScore < 50 && "Journaling daily strengthens reflective thinking. Aim for a short entry each day.",
    clarityScore < 50 && "Your cognitive load is high. Consider meditation or blocking distractions.",
    stepsScore < 50 && "Walking boosts BDNF (brain growth factor). Aim for 8,000 steps daily.",
    positiveRatio < 50 && "Low positive emotion ratio this week. What one small joy can you plan for tomorrow?",
  ].filter(Boolean) as string[];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-200">Neuroplasticity Tracker</h2>

      <div className="mb-5 flex items-center gap-4">
        <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={level.color} strokeWidth="3"
              strokeDasharray={`${brainHealthScore} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-center">
            <span className="block text-lg font-bold text-slate-100">{brainHealthScore}</span>
            <span className="block text-[9px] text-slate-500">/ 100</span>
          </span>
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: level.color }}>{level.label}</p>
          <p className="text-xs text-slate-500">Brain Health Score — this week</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {[
          { label: "Exercise", score: exerciseScore, detail: `${exerciseDays}/5 days`, color: "#22c55e" },
          { label: "Creative Output", score: journalScore, detail: `${weekEntries.length} journal entries`, color: "#a855f7" },
          { label: "Mental Clarity", score: clarityScore, detail: `avg cog. load ${weekCheckins.length > 0 ? (weekCheckins.reduce((s,c)=>s+c.cognitive_load,0)/weekCheckins.length).toFixed(1) : "—"}/10`, color: "#6366f1" },
          { label: "Positive Ratio", score: positiveRatio, detail: `${weekCheckins.filter(c=>c.valence>0).length}/${weekCheckins.length} positive days`, color: "#eab308" },
          { label: "Movement", score: stepsScore, detail: `${Math.round(avgSteps).toLocaleString()} avg steps`, color: "#3b82f6" },
        ].map(({ label, score, detail, color }) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-300">{label}</span>
              <span style={{ color }} className="font-medium">{Math.round(score)}%</span>
            </div>
            {scoreBar(score, color)}
            <p className="mt-0.5 text-[10px] text-slate-600">{detail}</p>
          </div>
        ))}
      </div>

      {tips.length > 0 && (
        <div className="rounded-lg border border-indigo-900/50 bg-indigo-950/30 p-3">
          <p className="mb-2 text-[11px] font-semibold text-indigo-300">💡 Claude&apos;s Tips</p>
          <ul className="flex flex-col gap-1.5">
            {tips.slice(0, 3).map((tip, i) => (
              <li key={i} className="text-[11px] text-slate-400">• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
