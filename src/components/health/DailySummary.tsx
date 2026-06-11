"use client";

import { DayLog, Goals } from "@/lib/health/types";
import { totalCalories, totalProtein } from "@/lib/health/utils";

function StatRow({
  label,
  value,
  goal,
  unit,
  pass,
  passLabel,
  failLabel,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  pass: boolean;
  passLabel: string;
  failLabel: string;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-200">{label}</span>
        <span className="text-slate-400">
          {value} / {goal} {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${pass ? "bg-emerald-500" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          pass ? "bg-emerald-900/60 text-emerald-300" : "bg-amber-900/60 text-amber-300"
        }`}
      >
        {pass ? passLabel : failLabel}
      </span>
    </div>
  );
}

export default function DailySummary({
  log,
  goals,
  onStepsChange,
}: {
  log: DayLog;
  goals: Goals;
  onStepsChange: (steps: number) => void;
}) {
  const calories = totalCalories(log);
  const protein = totalProtein(log);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200">Today&apos;s summary</h2>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        Steps today
        <input
          type="number"
          min={0}
          value={log.steps}
          onChange={(e) => onStepsChange(Number(e.target.value))}
          className="w-28 rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </label>

      <StatRow
        label="Steps"
        value={log.steps}
        goal={goals.stepGoal}
        unit="steps"
        pass={log.steps >= goals.stepGoal}
        passLabel="Goal hit"
        failLabel="Below goal"
      />

      <StatRow
        label="Calories"
        value={calories}
        goal={goals.calorieGoal}
        unit="kcal"
        pass={calories <= goals.calorieGoal}
        passLabel="In deficit"
        failLabel="Over goal"
      />

      <StatRow
        label="Protein"
        value={protein}
        goal={goals.proteinGoal}
        unit="g"
        pass={protein >= goals.proteinGoal}
        passLabel="Goal hit"
        failLabel="Below goal"
      />
    </section>
  );
}
