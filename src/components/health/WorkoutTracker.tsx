"use client";

import { useState } from "react";
import { ExerciseEntry, MuscleGroup, SetEntry } from "@/lib/health/types";
import { EXERCISE_PRESETS, MUSCLE_LABELS, MUSCLE_GROUPS } from "@/lib/health/constants";
import BodyDiagram from "./BodyDiagram";

const CUSTOM_OPTION = "__custom__";

function emptySet(): SetEntry {
  return { reps: 10, weight: 0 };
}

export default function WorkoutTracker({
  exercises,
  onAdd,
  onDelete,
}: {
  exercises: ExerciseEntry[];
  onAdd: (exercise: Omit<ExerciseEntry, "id">) => void;
  onDelete: (id: string) => void;
}) {
  const [preset, setPreset] = useState(EXERCISE_PRESETS[0].name);
  const [customName, setCustomName] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup>(EXERCISE_PRESETS[0].muscle);
  const [sets, setSets] = useState<SetEntry[]>([emptySet()]);

  const isCustom = preset === CUSTOM_OPTION;

  function handlePresetChange(value: string) {
    setPreset(value);
    if (value !== CUSTOM_OPTION) {
      const found = EXERCISE_PRESETS.find((p) => p.name === value);
      if (found) setMuscle(found.muscle);
    }
  }

  function updateSet(index: number, field: keyof SetEntry, value: number) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function addSetRow() {
    setSets((prev) => [...prev, emptySet()]);
  }

  function removeSetRow(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = isCustom ? customName.trim() : preset;
    if (!name) return;

    const validSets = sets.filter((s) => s.reps > 0);
    if (validSets.length === 0) return;

    onAdd({ name, muscle, sets: validSets });

    setSets([emptySet()]);
    if (isCustom) setCustomName("");
  }

  const worked = new Set(exercises.map((e) => e.muscle));

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200">Workout</h2>

      <BodyDiagram worked={worked} />

      {exercises.length > 0 && (
        <ul className="flex flex-col gap-2">
          {exercises.map((ex) => (
            <li
              key={ex.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3"
            >
              <div>
                <p className="font-medium text-slate-100">
                  {ex.name}{" "}
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 shadow-sm">
                    {MUSCLE_LABELS[ex.muscle]}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  {ex.sets
                    .map((s) => `${s.reps} x ${s.weight}`)
                    .join(", ")}{" "}
                  {ex.sets[0]?.weight ? "lbs" : ""}
                </p>
              </div>
              <button
                onClick={() => onDelete(ex.id)}
                className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-900 hover:text-rose-400"
                aria-label="Delete exercise"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-slate-800 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Exercise
            <select
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
            >
              {EXERCISE_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
              <option value={CUSTOM_OPTION}>Custom…</option>
            </select>
          </label>

          {isCustom && (
            <input
              type="text"
              placeholder="Exercise name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
            />
          )}

          <label className="flex items-center gap-2 text-sm text-slate-300">
            Muscle
            <select
              value={muscle}
              onChange={(e) => setMuscle(e.target.value as MuscleGroup)}
              className="rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
            >
              {MUSCLE_GROUPS.map((m) => (
                <option key={m} value={m}>
                  {MUSCLE_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          {sets.map((set, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-12 text-xs text-slate-500">Set {i + 1}</span>
              <input
                type="number"
                min={0}
                value={set.reps}
                onChange={(e) => updateSet(i, "reps", Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
              />
              <span className="text-xs text-slate-500">reps @</span>
              <input
                type="number"
                min={0}
                value={set.weight}
                onChange={(e) => updateSet(i, "weight", Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-600 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
              />
              <span className="text-xs text-slate-500">lbs</span>
              {sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSetRow(i)}
                  className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-rose-400"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSetRow}
            className="self-start text-xs font-medium text-indigo-400 hover:text-indigo-400"
          >
            + Add set
          </button>
        </div>

        <button
          type="submit"
          className="self-start rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          Log exercise
        </button>
      </form>
    </section>
  );
}
