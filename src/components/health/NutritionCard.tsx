"use client";

import { useRef, useState } from "react";
import { FoodEntry } from "@/lib/health/types";
import { scanBarcodeFromImage } from "@/lib/barcode/scanBarcode";

interface FoodSearchResult {
  name: string;
  brand?: string;
  servingSize?: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
}

interface Props {
  food: FoodEntry[];
  calorieGoal: number;
  proteinGoal: number;
  focusMinutes: number;
  onAdd: (entry: Omit<FoodEntry, "id">) => void;
  onDelete: (id: string) => void;
}

function ProgressBar({ value, goal, color }: { value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function NutritionCard({ food, calorieGoal, proteinGoal, focusMinutes, onAdd, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<Omit<FoodEntry, "id"> | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalCalories = food.reduce((s, f) => s + f.calories, 0);
  const totalProtein = food.reduce((s, f) => s + f.protein, 0);
  const caloriesLeft = calorieGoal - totalCalories;

  function handleSearchChange(q: string) {
    setSearch(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
        const data = await res.json() as { results: FoodSearchResult[] };
        setResults(data.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  function selectResult(r: FoodSearchResult) {
    setPending({ name: r.name, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, servingSize: r.servingSize });
    setSearch("");
    setResults([]);
  }

  function confirmAdd() {
    if (!pending) return;
    onAdd(pending);
    setPending(null);
  }

  async function handleBarcode(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const barcode = await scanBarcodeFromImage(dataUrl);
      if (barcode) {
        const res = await fetch(`/api/food-lookup?barcode=${encodeURIComponent(barcode)}`);
        const data = await res.json() as { found: boolean; name?: string; calories?: number; protein?: number; carbs?: number; fat?: number; servingSize?: string };
        if (data.found && data.name && data.calories != null) {
          setPending({ name: data.name, calories: data.calories, protein: data.protein ?? 0, carbs: data.carbs, fat: data.fat, servingSize: data.servingSize });
        }
      }
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const focusHours = Math.floor(focusMinutes / 60);
  const focusMins = focusMinutes % 60;
  const focusLabel = focusMinutes === 0 ? "—" : focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Nutrition</h2>

      {/* Summary bars */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Calories</span>
            <span className={totalCalories > calorieGoal ? "text-rose-400" : "text-slate-300"}>
              {totalCalories} / {calorieGoal} kcal
              {caloriesLeft >= 0 ? ` · ${caloriesLeft} left` : ` · ${Math.abs(caloriesLeft)} over`}
            </span>
          </div>
          <ProgressBar value={totalCalories} goal={calorieGoal} color={totalCalories > calorieGoal ? "bg-rose-500" : "bg-emerald-500"} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Protein</span>
            <span className={totalProtein >= proteinGoal ? "text-emerald-400" : "text-slate-300"}>
              {Math.round(totalProtein)}g / {proteinGoal}g
            </span>
          </div>
          <ProgressBar value={totalProtein} goal={proteinGoal} color={totalProtein >= proteinGoal ? "bg-emerald-500" : "bg-indigo-500"} />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Focus time today</span>
          <span className="font-medium text-indigo-300">{focusLabel}</span>
        </div>
      </div>

      {/* Food search */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search food (e.g. banana, chicken breast…)"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            title="Scan barcode"
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
          >
            {scanning ? "…" : "📷"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBarcode} />
        </div>

        {searching && (
          <p className="mt-1 text-xs text-slate-500">Searching…</p>
        )}

        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-600 bg-slate-800 shadow-lg">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  onClick={() => selectResult(r)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-slate-700"
                >
                  <div>
                    <span className="font-medium text-slate-100">{r.name}</span>
                    {r.brand && <span className="ml-1.5 text-xs text-slate-500">{r.brand}</span>}
                    {r.servingSize && <span className="ml-1 text-xs text-slate-500">· {r.servingSize}</span>}
                  </div>
                  <span className="ml-3 shrink-0 text-xs text-slate-400">
                    {r.calories} kcal · {r.protein}g protein
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending food confirmation */}
      {pending && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-700 bg-indigo-900/30 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-slate-100">{pending.name}</p>
            <p className="text-xs text-slate-400">
              {pending.calories} kcal · {pending.protein}g protein
              {pending.servingSize ? ` · ${pending.servingSize}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmAdd}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Add
            </button>
            <button
              onClick={() => setPending(null)}
              className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Food log */}
      {food.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-t border-slate-800 pt-3">
          {food.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-100">{f.name}</span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{f.calories} kcal</span>
                <span>{f.protein}g P</span>
                <button
                  onClick={() => onDelete(f.id)}
                  className="text-slate-600 hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
