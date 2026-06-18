"use client";

import { useState } from "react";
import { DayLog, Goals } from "@/lib/health/types";
import { EmotionLog } from "@/lib/health/useEmotionLogs";

interface Props {
  log: DayLog;
  goals: Goals;
  emotionLogs: EmotionLog[];
  canLogEmotion: boolean;
  onLogEmotion: (score: number) => Promise<boolean>;
}

function statusColor(status: "green" | "yellow" | "red"): string {
  return status === "green"
    ? "text-emerald-400"
    : status === "yellow"
    ? "text-amber-400"
    : "text-rose-400";
}

function statusBg(status: "green" | "yellow" | "red"): string {
  return status === "green"
    ? "bg-emerald-900/40 border-emerald-700"
    : status === "yellow"
    ? "bg-amber-900/40 border-amber-700"
    : "bg-rose-900/40 border-rose-700";
}

function sleepStatus(minutes: number | undefined): "green" | "yellow" | "red" {
  if (!minutes) return "red";
  const h = minutes / 60;
  if (h >= 7) return "green";
  if (h >= 5) return "yellow";
  return "red";
}

function stepsStatus(steps: number, goal: number): "green" | "yellow" | "red" {
  if (steps >= goal) return "green";
  if (steps >= goal * 0.5) return "yellow";
  return "red";
}

function hrStatus(bpm: number | undefined): "green" | "yellow" | "red" {
  if (!bpm) return "yellow";
  if (bpm >= 60 && bpm <= 100) return "green";
  return "yellow";
}

function emotionStatus(score: number | null): "green" | "yellow" | "red" {
  if (score === null) return "red";
  if (score >= 7) return "green";
  if (score >= 4) return "yellow";
  return "red";
}

function formatSleep(minutes: number | undefined): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function VitalsCard({ log, goals, emotionLogs, canLogEmotion, onLogEmotion }: Props) {
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [logging, setLogging] = useState(false);

  const latestEmotion = emotionLogs.length > 0 ? emotionLogs[emotionLogs.length - 1].score : null;
  const steps = Math.max(log.steps, log.googleFit?.stepsFromFit ?? 0);
  const sleep = log.googleFit?.sleepMinutes;
  const hr = log.googleFit?.heartRateBpm;

  async function handleEmotion(score: number) {
    setLogging(true);
    await onLogEmotion(score);
    setLogging(false);
    setShowEmotionPicker(false);
  }

  const vitals = [
    {
      icon: "💜",
      label: "Mood",
      value: latestEmotion != null ? `${latestEmotion}/10` : "Not logged",
      status: emotionStatus(latestEmotion),
      extra:
        emotionLogs.length > 0
          ? `${emotionLogs.length}/3 today`
          : undefined,
      action: canLogEmotion ? (
        <button
          onClick={() => setShowEmotionPicker((v) => !v)}
          className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-indigo-500"
        >
          + Log
        </button>
      ) : null,
    },
    {
      icon: "❤️",
      label: "Heart Rate",
      value: hr ? `${Math.round(hr)} bpm` : "—",
      status: hrStatus(hr),
      extra: undefined,
      action: null,
    },
    {
      icon: "👟",
      label: "Steps",
      value: steps.toLocaleString(),
      status: stepsStatus(steps, goals.stepGoal),
      extra: `Goal: ${goals.stepGoal.toLocaleString()}`,
      action: null,
    },
    {
      icon: "😴",
      label: "Sleep",
      value: formatSleep(sleep),
      status: sleepStatus(sleep),
      extra: sleep ? `Goal: ${Math.floor(goals.sleepGoal / 60)}h` : undefined,
      action: null,
    },
  ];

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Vitals</h2>

      <div className="grid grid-cols-2 gap-2">
        {vitals.map((v) => {
          const s = v.status as "green" | "yellow" | "red";
          return (
            <div
              key={v.label}
              className={`flex flex-col gap-1.5 rounded-lg border p-3 ${statusBg(s)}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{v.icon}</span>
                {v.action}
              </div>
              <span className={`text-base font-bold ${statusColor(s)}`}>
                {v.value}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{v.label}</span>
                {v.extra && (
                  <span className="text-[10px] text-slate-500">{v.extra}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Emotion picker */}
      {showEmotionPicker && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
          <p className="mb-2 text-xs text-slate-400">How are you feeling? (1–10)</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                disabled={logging}
                onClick={() => handleEmotion(n)}
                className="h-8 w-8 rounded-lg bg-slate-700 text-sm font-semibold text-slate-200 transition hover:bg-indigo-600 disabled:opacity-50"
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowEmotionPicker(false)}
            className="mt-2 text-xs text-slate-500 hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      {emotionLogs.length > 0 && (
        <div className="flex gap-2">
          {emotionLogs.map((l, i) => (
            <span
              key={l.id}
              className="rounded-full bg-indigo-900/50 px-2 py-0.5 text-[10px] text-indigo-300"
            >
              {["Morning", "Afternoon", "Evening"][i]}: {l.score}/10
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
