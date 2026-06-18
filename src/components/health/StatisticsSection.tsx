"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useHealthStats, StatPoint } from "@/lib/health/useHealthStats";

type DayRange = 30 | 90 | 0;

function StatChart({
  label,
  data,
  color,
  unit,
  yDomain,
}: {
  label: string;
  data: StatPoint[];
  color: string;
  unit: string;
  yDomain?: [number | "auto", number | "auto"];
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-medium text-slate-400">{label}</h3>
        <p className="text-xs text-slate-600">No data yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-slate-300">{label}</h3>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            domain={yDomain ?? ["auto", "auto"]}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#e2e8f0",
            }}
            formatter={(v) => [`${v} ${unit}`, label]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function StatisticsSection() {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<DayRange>(30);
  const { stats, loaded } = useHealthStats(days === 0 ? 365 : days);

  const charts = [
    { label: "Mood (1-10)", data: stats.emotions, color: "#a78bfa", unit: "/10", yDomain: [0, 10] as [number, number] },
    { label: "Heart Rate", data: stats.heartRate, color: "#f87171", unit: "bpm" },
    { label: "Sleep (hours)", data: stats.sleep, color: "#60a5fa", unit: "h", yDomain: [0, 12] as [number, number] },
    { label: "Steps", data: stats.steps, color: "#34d399", unit: "" },
    { label: "Weight (kg)", data: stats.weight, color: "#fb923c", unit: "kg" },
    { label: "Calories", data: stats.calories, color: "#facc15", unit: "kcal" },
    { label: "Protein (g)", data: stats.protein, color: "#c084fc", unit: "g" },
    { label: "Focus Time (min)", data: stats.focusTime, color: "#38bdf8", unit: "min" },
  ];

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl p-4 text-left"
      >
        <h2 className="text-sm font-semibold text-slate-200">Statistics</h2>
        <span className="text-slate-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-5 border-t border-slate-800 p-4">
          {/* Range selector */}
          <div className="flex gap-2">
            {([30, 90, 0] as DayRange[]).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  days === d
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {d === 0 ? "All time" : `${d} days`}
              </button>
            ))}
          </div>

          {!loaded ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {charts.map((c) => (
                <StatChart
                  key={c.label}
                  label={c.label}
                  data={c.data}
                  color={c.color}
                  unit={c.unit}
                  yDomain={c.yDomain as [number | "auto", number | "auto"] | undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
