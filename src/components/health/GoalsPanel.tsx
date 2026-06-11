"use client";

import { Goals } from "@/lib/health/types";

export default function GoalsPanel({
  goals,
  onChange,
}: {
  goals: Goals;
  onChange: (goals: Goals) => void;
}) {
  function update(field: keyof Goals, value: number) {
    onChange({ ...goals, [field]: value });
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200">Daily goals</h2>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Step goal
          <input
            type="number"
            min={0}
            step={500}
            value={goals.stepGoal}
            onChange={(e) => update("stepGoal", Number(e.target.value))}
            className="w-28 rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Calorie goal
          <input
            type="number"
            min={0}
            step={50}
            value={goals.calorieGoal}
            onChange={(e) => update("calorieGoal", Number(e.target.value))}
            className="w-28 rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Protein goal (g)
          <input
            type="number"
            min={0}
            step={5}
            value={goals.proteinGoal}
            onChange={(e) => update("proteinGoal", Number(e.target.value))}
            className="w-28 rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>
      </div>
    </section>
  );
}
