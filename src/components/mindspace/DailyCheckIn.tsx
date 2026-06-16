"use client";

import { useState } from "react";
import { DailyCheckin } from "@/lib/mindspace/types";
import ValenceArousalGrid from "./ValenceArousalGrid";

const PERMA = [
  { key: "perma_p", label: "Positive Emotions", emoji: "😊", desc: "How positive are you feeling today?" },
  { key: "perma_e", label: "Engagement", emoji: "🎯", desc: "How absorbed were you in what you did?" },
  { key: "perma_r", label: "Relationships", emoji: "🤝", desc: "How meaningful were your connections today?" },
  { key: "perma_m", label: "Meaning", emoji: "✨", desc: "Did today feel purposeful?" },
  { key: "perma_a", label: "Achievement", emoji: "🏆", desc: "How much did you accomplish?" },
] as const;

type PermaKey = typeof PERMA[number]["key"];

interface Props {
  existing: DailyCheckin | null;
  date: string;
  onSave: (data: Omit<DailyCheckin, "id" | "created_at">) => Promise<void>;
}

export default function DailyCheckIn({ existing, date, onSave }: Props) {
  const [valence, setValence] = useState(existing?.valence ?? 0);
  const [arousal, setArousal] = useState(existing?.arousal ?? 0);
  const [perma, setPerma] = useState<Record<PermaKey, number>>({
    perma_p: existing?.perma_p ?? 5,
    perma_e: existing?.perma_e ?? 5,
    perma_r: existing?.perma_r ?? 5,
    perma_m: existing?.perma_m ?? 5,
    perma_a: existing?.perma_a ?? 5,
  });
  const [cogLoad, setCogLoad] = useState(existing?.cognitive_load ?? 5);
  const [sentiment, setSentiment] = useState(existing?.sentiment ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ date, valence, arousal, ...perma, cognitive_load: cogLoad, sentiment });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Daily Check-in</h2>
        <span className="text-xs text-slate-500">{date}</span>
      </div>

      <div className="flex flex-col gap-5">
        {/* VA Grid */}
        <div>
          <p className="mb-3 text-xs text-slate-400">Tap where you are right now</p>
          <div className="flex justify-center">
            <ValenceArousalGrid valence={valence} arousal={arousal} onChange={(v, a) => { setValence(v); setArousal(a); }} size={180} />
          </div>
        </div>

        {/* PERMA sliders */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-slate-400">PERMA Pillars</p>
          {PERMA.map(({ key, label, emoji, desc }) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-slate-300">{emoji} {label}</span>
                <span className="text-xs font-medium text-indigo-300">{perma[key]}/10</span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={perma[key]}
                onChange={e => setPerma(p => ({ ...p, [key]: Number(e.target.value) }))}
                title={desc}
                className="w-full accent-indigo-500"
              />
            </div>
          ))}
        </div>

        {/* Cognitive load */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-slate-300">🧠 Cognitive Load</span>
            <span className="text-xs font-medium" style={{ color: cogLoad > 7 ? "#ef4444" : cogLoad > 4 ? "#eab308" : "#22c55e" }}>
              {cogLoad}/10
            </span>
          </div>
          <input
            type="range" min={1} max={10} step={1} value={cogLoad}
            onChange={e => setCogLoad(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="mt-0.5 flex justify-between text-[10px] text-slate-600">
            <span>Clear-headed</span><span>Drained</span>
          </div>
        </div>

        {/* Sentiment sentence */}
        <div>
          <label className="mb-1 block text-xs text-slate-400">Today I feel… (one sentence)</label>
          <input
            value={sentiment}
            onChange={e => setSentiment(e.target.value)}
            placeholder="Today I feel… because…"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Check-in"}
        </button>
      </div>
    </div>
  );
}
