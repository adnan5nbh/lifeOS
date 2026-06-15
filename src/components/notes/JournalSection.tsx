"use client";

import { useState } from "react";
import { useJournal } from "@/lib/notes/useJournal";
import { todayKey } from "@/lib/health/utils";

export default function JournalSection() {
  const { entries, loaded, addEntry, deleteEntry, analyseEntry } = useJournal();
  const [date, setDate] = useState(todayKey());
  const [content, setContent] = useState("");
  const [analysing, setAnalysing] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    const shouldAnalyse = trimmed.toLowerCase().startsWith("/analyse");
    const finalContent = shouldAnalyse ? trimmed.slice("/analyse".length).trim() : trimmed;
    if (!finalContent) return;

    setContent("");
    const entry = await addEntry(date, finalContent);
    if (shouldAnalyse && entry) {
      setAnalysing(entry.id);
      await analyseEntry(entry.id);
      setAnalysing(null);
    }
  }

  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const group = groups.get(entry.date) ?? [];
    group.push(entry);
    groups.set(entry.date, group);
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200">Journal</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40 rounded-lg border border-slate-600 px-2 py-1 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write about your day… (try /analyse for AI feedback)"
          rows={4}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="submit"
          className="self-end rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          Add entry
        </button>
      </form>

      {!loaded && <p className="text-sm text-slate-500">Loading…</p>}

      <div className="flex flex-col gap-4">
        {Array.from(groups.entries()).map(([groupDate, groupEntries]) => (
          <div key={groupDate} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-slate-400">{groupDate}</h3>
            {groupEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-slate-800 bg-slate-950 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-sm text-slate-100">{entry.content}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setAnalysing(entry.id);
                        analyseEntry(entry.id).finally(() => setAnalysing(null));
                      }}
                      disabled={analysing === entry.id}
                      className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-indigo-300 disabled:opacity-50"
                    >
                      {analysing === entry.id ? "Analysing…" : "Analyse"}
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="rounded-lg px-2 py-1 text-slate-500 hover:text-rose-400"
                      aria-label="Delete entry"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {entry.aiAnalysis && (
                  <div className="mt-2 border-l-2 border-indigo-400 bg-slate-800 pl-3 py-2 text-sm text-slate-300">
                    {entry.aiAnalysis}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
