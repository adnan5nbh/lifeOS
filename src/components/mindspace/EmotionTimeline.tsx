"use client";

import { useState } from "react";
import { DailyCheckin } from "@/lib/mindspace/types";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

type View = "week" | "month" | "all";

function lastNDays(n: number, data: DailyCheckin[]): DailyCheckin[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - n);
  const key = cutoff.toISOString().slice(0, 10);
  return data.filter(c => c.date >= key);
}

function MoodCalendar({ checkins }: { checkins: DailyCheckin[] }) {
  const map = new Map(checkins.map(c => [c.date, c.valence]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, valence: map.get(key) ?? null };
  });

  function color(v: number | null): string {
    if (v === null) return "#1e293b";
    if (v > 0.4) return "#22c55e";
    if (v > 0) return "#86efac";
    if (v > -0.4) return "#fca5a5";
    return "#ef4444";
  }

  return (
    <div className="flex flex-wrap gap-1">
      {days.map(d => (
        <div
          key={d.date}
          title={`${d.date}${d.valence !== null ? `: mood ${(d.valence * 100).toFixed(0)}%` : " — no check-in"}`}
          style={{ background: color(d.valence), width: 13, height: 13, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

export default function EmotionTimeline({ checkins }: { checkins: DailyCheckin[] }) {
  const [view, setView] = useState<View>("month");
  const sorted = [...checkins].sort((a, b) => a.date.localeCompare(b.date));

  const filtered = view === "week" ? lastNDays(7, sorted)
    : view === "month" ? lastNDays(30, sorted)
    : sorted;

  const chartData = filtered.map(c => ({
    date: c.date.slice(5),
    Mood: +((c.valence * 5 + 5).toFixed(1)),
    Energy: +((c.arousal * 5 + 5).toFixed(1)),
    PERMA: +(((c.perma_p + c.perma_e + c.perma_r + c.perma_m + c.perma_a) / 5).toFixed(1)),
    "Cog. Load": c.cognitive_load,
  }));

  const views: { label: string; value: View }[] = [
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "All", value: "all" },
  ];

  if (checkins.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Emotion Timeline</h2>
        <p className="text-xs text-slate-500">Complete some daily check-ins to see trends here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Emotion Timeline</h2>
        <div className="flex gap-1">
          {views.map(v => (
            <button key={v.value} onClick={() => setView(v.value)}
              className="rounded-md px-2.5 py-1 text-xs transition"
              style={{ background: view === v.value ? "#4f46e5" : "transparent", color: view === v.value ? "#fff" : "#94a3b8" }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length < 2 ? (
        <p className="text-xs text-slate-500">Not enough data for this range yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="2,4" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: "#64748b" }} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 11 }} labelStyle={{ color: "#94a3b8" }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: "#64748b" }} />
            <Line type="monotone" dataKey="Mood" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Energy" stroke="#f97316" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="PERMA" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Cog. Load" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3,2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4">
        <p className="mb-2 text-[11px] text-slate-500">Mood heatmap — last 30 days</p>
        <MoodCalendar checkins={checkins} />
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-600">
          {[["#22c55e","Very positive"],["#86efac","Positive"],["#fca5a5","Negative"],["#ef4444","Very negative"],["#1e293b","No data"]].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1"><span style={{ background: c, width: 8, height: 8, borderRadius: 1, display: "inline-block" }} />{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
