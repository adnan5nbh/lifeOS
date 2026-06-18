"use client";

import { useState } from "react";
import { MuscleGroup } from "@/lib/health/types";
import { TodayWorkout, MuscleActivityEntry } from "@/lib/health/useTodayWorkout";
import BodyMapSVG from "./BodyMapSVG";

interface Props {
  workouts: TodayWorkout[];
  muscleActivity: Partial<Record<MuscleGroup, MuscleActivityEntry>>;
  workoutRating: number;
  totalSets: number;
}

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps",
  triceps: "Triceps", abs: "Abs", quads: "Quads", hamstrings: "Hamstrings",
  glutes: "Glutes", calves: "Calves",
};

function muscleColor(sets: number): string {
  if (sets === 0) return "#1e293b";
  if (sets <= 2) return "#4c1d95";
  if (sets <= 5) return "#7e22ce";
  return "#a855f7";
}

function RatingDots({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < rating ? "bg-indigo-400" : "bg-slate-700"}`}
        />
      ))}
      <span className="ml-1.5 text-xs text-indigo-300">{rating}/10</span>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function WorkoutCard({ workouts, muscleActivity, workoutRating, totalSets }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasWorkout = workouts.length > 0;
  const workedMuscles = Object.entries(muscleActivity) as [MuscleGroup, MuscleActivityEntry][];

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Workout</h2>
        {hasWorkout && <RatingDots rating={workoutRating} />}
      </div>

      {!hasWorkout ? (
        <div className="py-4 text-center text-sm text-slate-500">
          No workout logged today. Sync from Hevy or go crush it!
        </div>
      ) : (
        <>
          {/* Workout summary */}
          <div className="flex flex-wrap gap-2">
            {workouts.map((w) => (
              <div key={w.id} className="flex flex-col rounded-lg bg-slate-800/60 px-3 py-2">
                <span className="text-sm font-medium text-slate-100">{w.title}</span>
                <span className="text-xs text-slate-500">
                  {formatDuration(w.duration_seconds)} · {w.exercises.length} exercise{w.exercises.length !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>

          {/* Body map */}
          <BodyMapSVG muscleActivity={muscleActivity} />

          {/* Muscle legend */}
          {workedMuscles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {workedMuscles.map(([muscle, data]) => (
                <div
                  key={muscle}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                  style={{ backgroundColor: muscleColor(data.sets) + "33", border: `1px solid ${muscleColor(data.sets)}55` }}
                >
                  <span style={{ color: muscleColor(data.sets) }}>{MUSCLE_LABELS[muscle]}</span>
                  <span className="text-slate-500">{data.sets} sets</span>
                </div>
              ))}
            </div>
          )}

          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
          >
            {expanded ? "▲ Hide details" : "▼ See full workout"}
          </button>

          {expanded && (
            <div className="flex flex-col gap-3 border-t border-slate-800 pt-3">
              {workouts.flatMap((w) =>
                w.exercises.map((ex, i) => (
                  <div key={`${w.id}-${i}`} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{ex.name}</span>
                      <span className="text-[10px] text-slate-500">{MUSCLE_LABELS[ex.muscle]}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ex.sets.map((s, si) => (
                        <span
                          key={si}
                          className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                        >
                          {s.reps} × {s.weight_kg > 0 ? `${s.weight_kg}kg` : "BW"}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
