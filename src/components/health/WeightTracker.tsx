"use client";

import { useState } from "react";
import { WeightLog } from "@/lib/health/useWeightLogs";

interface Props {
  logs: WeightLog[];
  latestWeight: WeightLog | null;
  onLog: (kg: number) => Promise<void>;
}

function Sparkline({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) return null;
  const recent = logs.slice(-20);
  const values = recent.map((l) => l.weight_kg);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = max - min || 1;
  const w = 200;
  const h = 50;
  const pts = recent.map((l, i) => {
    const x = (i / (recent.length - 1)) * w;
    const y = h - ((l.weight_kg - min) / range) * h;
    return `${x},${y}`;
  });

  const trend = values[values.length - 1] - values[0];

  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible">
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={trend <= 0 ? "#34d399" : "#f87171"}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {recent.map((l, i) => {
          const x = (i / (recent.length - 1)) * w;
          const y = h - ((l.weight_kg - min) / range) * h;
          return <circle key={l.id} cx={x} cy={y} r={2.5} fill={trend <= 0 ? "#34d399" : "#f87171"} />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{recent[0].date.slice(5)}</span>
        <span className={trend <= 0 ? "text-emerald-400" : "text-rose-400"}>
          {trend > 0 ? "+" : ""}{trend.toFixed(1)} kg
        </span>
        <span>{recent[recent.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}

export default function WeightTracker({ logs, latestWeight, onLog }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue] = useState(latestWeight?.weight_kg.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const kg = parseFloat(value);
    if (isNaN(kg) || kg <= 0) return;
    setSaving(true);
    await onLog(kg);
    setSaving(false);
    setShowInput(false);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Weight</h2>
        <button
          onClick={() => {
            setShowInput((v) => !v);
            setValue(latestWeight?.weight_kg.toString() ?? "");
          }}
          className="rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-medium text-white hover:bg-indigo-500"
        >
          + Log
        </button>
      </div>

      {latestWeight ? (
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-100">{latestWeight.weight_kg.toFixed(1)}</span>
          <span className="text-base text-slate-400">kg</span>
          <span className="ml-auto text-xs text-slate-500">{latestWeight.date}</span>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No weight logged yet</p>
      )}

      {showInput && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 75.5"
            className="w-28 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-sm text-slate-400">kg</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "…" : "Save"}
          </button>
          <button onClick={() => setShowInput(false)} className="text-sm text-slate-500 hover:text-slate-300">
            Cancel
          </button>
        </div>
      )}

      <Sparkline logs={logs} />
    </section>
  );
}
