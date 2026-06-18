"use client";

import { GoogleFitData } from "@/lib/health/types";

function fmt(n: number | undefined, unit: string, decimals = 0): string {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(decimals)} ${unit}`;
}

function formatSleep(minutes: number | undefined): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatSyncTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function GoogleFitPanel({ data }: { data: GoogleFitData }) {
  const metrics = [
    {
      icon: "😴",
      label: "Sleep",
      value: formatSleep(data.sleepMinutes),
      highlight: data.sleepMinutes !== undefined,
    },
    {
      icon: "❤️",
      label: "Heart Rate",
      value: fmt(data.heartRateBpm, "bpm", 0),
      highlight: data.heartRateBpm !== undefined,
    },
    {
      icon: "⚡",
      label: "Active",
      value: fmt(data.activeMinutes, "min"),
      highlight: data.activeMinutes !== undefined,
    },
  ];

  const anyData = metrics.some(m => m.highlight);
  if (!anyData) return null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Google Fit</h2>
        {data.syncedAt && (
          <span className="text-[10px] text-slate-500">
            Synced {formatSyncTime(data.syncedAt)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {metrics.map(m => (
          <div
            key={m.label}
            className="flex flex-col items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-3 text-center"
          >
            <span className="text-xl">{m.icon}</span>
            <span className="text-sm font-semibold text-slate-100">{m.value}</span>
            <span className="text-[10px] text-slate-500">{m.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
