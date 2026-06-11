"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DayLog, Goals } from "@/lib/health/types";
import { lastNDays, shortLabel, totalCalories, totalProtein, totalVolume } from "@/lib/health/utils";

function Chart({
  title,
  data,
  dataKey,
  color,
  goal,
}: {
  title: string;
  data: { label: string; value: number }[];
  dataKey: string;
  color: string;
  goal?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip />
            {goal !== undefined && (
              <ReferenceLine y={goal} stroke="#f59e0b" strokeDasharray="4 4" />
            )}
            <Line
              type="monotone"
              dataKey={dataKey}
              name={title}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ProgressGraphs({
  logs,
  goals,
}: {
  logs: Record<string, DayLog>;
  goals: Goals;
}) {
  const days = lastNDays(14);

  const stepsData = days.map((key) => ({
    label: shortLabel(key),
    value: logs[key]?.steps ?? 0,
  }));
  const caloriesData = days.map((key) => ({
    label: shortLabel(key),
    value: logs[key] ? totalCalories(logs[key]) : 0,
  }));
  const proteinData = days.map((key) => ({
    label: shortLabel(key),
    value: logs[key] ? totalProtein(logs[key]) : 0,
  }));
  const volumeData = days.map((key) => ({
    label: shortLabel(key),
    value: logs[key] ? totalVolume(logs[key]) : 0,
  }));

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200">
        Progress (last 14 days)
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Chart title="Steps" data={stepsData} dataKey="value" color="#6366f1" goal={goals.stepGoal} />
        <Chart title="Calories" data={caloriesData} dataKey="value" color="#f97316" goal={goals.calorieGoal} />
        <Chart title="Protein (g)" data={proteinData} dataKey="value" color="#10b981" goal={goals.proteinGoal} />
        <Chart title="Weight lifted (lbs total)" data={volumeData} dataKey="value" color="#0ea5e9" />
      </div>
    </section>
  );
}
