"use client";

import { useEffect, useState } from "react";
import { Goals } from "@/lib/health/types";

interface Props {
  goals: Goals;
  onGoalsChange: (goals: Goals) => Promise<void>;
}

export default function HealthSettingsSection({ goals, onGoalsChange }: Props) {
  const [open, setOpen] = useState(false);
  const [fitConnected, setFitConnected] = useState(false);
  const [fitSyncing, setFitSyncing] = useState(false);
  const [fitMsg, setFitMsg] = useState<string | null>(null);
  const [hevyConfigured, setHevyConfigured] = useState(false);
  const [hevySyncing, setHevySyncing] = useState(false);
  const [hevyMsg, setHevyMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<Goals>(goals);

  useEffect(() => {
    setDraft(goals);
  }, [goals]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/fit/status")
      .then((r) => r.json())
      .then((d: { connected: boolean }) => setFitConnected(d.connected))
      .catch(() => {});
    fetch("/api/hevy/status")
      .then((r) => r.json())
      .then((d: { configured: boolean }) => setHevyConfigured(d.configured))
      .catch(() => {});
  }, [open]);

  async function syncFit() {
    setFitSyncing(true);
    setFitMsg(null);
    try {
      const res = await fetch("/api/fit/sync", { method: "POST" });
      const d = await res.json() as { ok?: boolean; syncedDays?: number; error?: string };
      setFitMsg(d.ok ? `Synced ${d.syncedDays} day(s)` : (d.error ?? "Sync failed"));
    } catch { setFitMsg("Sync failed"); }
    finally { setFitSyncing(false); }
  }

  async function syncHevy() {
    setHevySyncing(true);
    setHevyMsg(null);
    try {
      const res = await fetch("/api/hevy/sync", { method: "POST" });
      const d = await res.json() as { ok?: boolean; newWorkouts?: number; error?: string };
      setHevyMsg(d.ok ? `${d.newWorkouts} new workout(s)` : (d.error ?? "Sync failed"));
    } catch { setHevyMsg("Sync failed"); }
    finally { setHevySyncing(false); }
  }

  function field(label: string, key: keyof Goals, unit: string) {
    return (
      <label key={key} className="flex flex-col gap-1 text-xs text-slate-400">
        {label}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            value={draft[key]}
            onChange={(e) => setDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
            className="w-24 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-slate-500">{unit}</span>
        </div>
      </label>
    );
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl p-4 text-left"
      >
        <h2 className="text-sm font-semibold text-slate-200">Settings & Goals</h2>
        <span className="text-slate-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-6 border-t border-slate-800 p-4">
          {/* Integrations */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Integrations</h3>

            <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-200">Google Fit</p>
                <p className="text-xs text-slate-500">{fitConnected ? "Connected" : "Not connected"}</p>
              </div>
              {fitConnected ? (
                <button
                  onClick={syncFit}
                  disabled={fitSyncing}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {fitSyncing ? "Syncing…" : "↻ Sync"}
                </button>
              ) : (
                <a
                  href="/api/auth/google"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Connect
                </a>
              )}
            </div>
            {fitMsg && <p className="text-xs text-indigo-400">{fitMsg}</p>}

            <div className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-200">Hevy</p>
                <p className="text-xs text-slate-500">{hevyConfigured ? "Configured" : "API key not set"}</p>
              </div>
              {hevyConfigured && (
                <button
                  onClick={syncHevy}
                  disabled={hevySyncing}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {hevySyncing ? "Syncing…" : "↻ Sync"}
                </button>
              )}
            </div>
            {hevyMsg && <p className="text-xs text-indigo-400">{hevyMsg}</p>}
          </div>

          {/* Goals */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Daily Goals</h3>
            <div className="grid grid-cols-2 gap-4">
              {field("Steps goal", "stepGoal", "steps")}
              {field("Calorie goal", "calorieGoal", "kcal")}
              {field("Protein goal", "proteinGoal", "g")}
              {field("Sleep goal", "sleepGoal", "min")}
            </div>
            <button
              onClick={() => onGoalsChange(draft)}
              className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Save goals
            </button>
          </div>

          {/* Notifications placeholder */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notifications</h3>
            <p className="text-xs text-slate-600">Notification preferences coming soon.</p>
          </div>
        </div>
      )}
    </section>
  );
}
