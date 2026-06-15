"use client";

import { useState } from "react";
import { FoodEntry } from "@/lib/health/types";

export default function FoodLogger({
  food,
  calorieGoal,
  onAdd,
  onDelete,
}: {
  food: FoodEntry[];
  calorieGoal: number;
  onAdd: (entry: Omit<FoodEntry, "id">) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), calories, protein });
    setName("");
    setCalories(0);
    setProtein(0);
  }

  const totalCalories = food.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = food.reduce((sum, f) => sum + f.protein, 0);
  const remaining = calorieGoal - totalCalories;
  const inDeficit = totalCalories <= calorieGoal;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200">Food log</h2>

      {food.length > 0 && (
        <ul className="flex flex-col gap-2">
          {food.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-2 px-3"
            >
              <span className="font-medium text-slate-100">{f.name}</span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{f.calories} kcal</span>
                <span>{f.protein} g protein</span>
                {f.carbs != null && <span>{f.carbs} g carbs</span>}
                {f.fat != null && <span>{f.fat} g fat</span>}
                <button
                  onClick={() => onDelete(f.id)}
                  className="rounded-lg px-2 py-1 text-slate-500 hover:text-rose-400"
                  aria-label="Delete food entry"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 border-t border-slate-800 pt-3">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Food
          <input
            type="text"
            placeholder="e.g. Chicken & rice"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Calories
          <input
            type="number"
            min={0}
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Protein (g)
          <input
            type="number"
            min={0}
            value={protein}
            onChange={(e) => setProtein(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          Add food
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950 p-3 text-sm">
        <div className="flex gap-4">
          <span className="font-medium text-slate-200">
            Total: {totalCalories} kcal
          </span>
          <span className="font-medium text-slate-200">
            {totalProtein} g protein
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            inDeficit
              ? "bg-emerald-900/60 text-emerald-300"
              : "bg-rose-900/60 text-rose-300"
          }`}
        >
          {inDeficit
            ? `In deficit · ${remaining} kcal left`
            : `Over goal by ${Math.abs(remaining)} kcal`}
        </span>
      </div>
    </section>
  );
}
