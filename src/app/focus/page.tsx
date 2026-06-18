"use client";

import { useEffect, useRef, useState } from "react";
import { useFocusSessions } from "@/lib/focus/useFocusSessions";
import { todayKey } from "@/lib/health/utils";

const WORK_MIN = 25;
const BREAK_MIN = 5;

type TimerState = "idle" | "running" | "paused" | "break";

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

export default function FocusPage() {
  const { sessions, addSession, deleteSession, totalMinutes, loaded } = useFocusSessions();

  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(WORK_MIN * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [label, setLabel] = useState("");
  const [manualMin, setManualMin] = useState("25");
  const [manualLabel, setManualLabel] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Session complete
            if (!isBreak) {
              void addSession(WORK_MIN, label || "Focus session");
              setIsBreak(true);
              setTimerState("break");
              return BREAK_MIN * 60;
            } else {
              setIsBreak(false);
              setTimerState("idle");
              return WORK_MIN * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    if (timerState === "idle" || timerState === "paused") {
      setTimerState("running");
    }
  }

  function pause() {
    if (timerState === "running") setTimerState("paused");
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("idle");
    setIsBreak(false);
    setSecondsLeft(WORK_MIN * 60);
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    const min = parseInt(manualMin);
    if (isNaN(min) || min <= 0) return;
    await addSession(min, manualLabel || undefined);
    setManualMin("25");
    setManualLabel("");
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalProgress = isBreak
    ? 1 - secondsLeft / (BREAK_MIN * 60)
    : 1 - secondsLeft / (WORK_MIN * 60);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - totalProgress);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="flex flex-1 justify-center bg-slate-950">
      <main className="flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
        <header>
          <h1 className="text-2xl font-bold text-slate-100">Focus</h1>
          <p className="text-sm text-slate-400">{today}</p>
        </header>

        {/* Pomodoro timer */}
        <section className="flex flex-col items-center gap-6 rounded-xl border border-slate-700 bg-slate-900 p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isBreak ? "Break" : timerState === "idle" ? "Ready" : timerState === "paused" ? "Paused" : "Focus"}
          </div>

          {/* Circular timer */}
          <div className="relative">
            <svg width="132" height="132" viewBox="0 0 132 132">
              <circle cx="66" cy="66" r="54" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle
                cx="66" cy="66" r="54" fill="none"
                stroke={isBreak ? "#34d399" : "#6366f1"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 66 66)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tabular-nums text-slate-100">
                {pad(minutes)}:{pad(seconds)}
              </span>
              <span className="text-xs text-slate-500">{isBreak ? "break" : "work"}</span>
            </div>
          </div>

          {/* Session label */}
          {!isBreak && (
            <input
              type="text"
              placeholder="What are you working on?"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-center text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {timerState !== "running" ? (
              <button
                onClick={start}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                {timerState === "paused" ? "Resume" : "Start"}
              </button>
            ) : (
              <button
                onClick={pause}
                className="rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Pause
              </button>
            )}
            <button
              onClick={reset}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-500 hover:text-slate-300"
            >
              Reset
            </button>
          </div>
        </section>

        {/* Today's stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl border border-slate-700 bg-slate-900 p-4">
            <span className="text-2xl font-bold text-indigo-300">{formatMinutes(totalMinutes)}</span>
            <span className="text-xs text-slate-500">Total focus today</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-slate-700 bg-slate-900 p-4">
            <span className="text-2xl font-bold text-indigo-300">{sessions.length}</span>
            <span className="text-xs text-slate-500">Sessions completed</span>
          </div>
        </section>

        {/* Manual add */}
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Add session manually</h2>
          <form onSubmit={handleManualAdd} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Duration (minutes)
              <input
                type="number"
                min={1}
                value={manualMin}
                onChange={(e) => setManualMin(e.target.value)}
                className="w-24 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Label (optional)
              <input
                type="text"
                placeholder="e.g. Deep work"
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                className="w-40 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Add
            </button>
          </form>
        </section>

        {/* Session log */}
        {loaded && sessions.length > 0 && (
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Today&apos;s sessions — {todayKey()}
            </h2>
            <ul className="flex flex-col gap-2">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-medium text-slate-100">
                      {s.label ?? "Focus session"}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      {new Date(s.started_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-300">{formatMinutes(s.duration_minutes)}</span>
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="text-slate-600 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
