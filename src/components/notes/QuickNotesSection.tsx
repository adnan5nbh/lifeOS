"use client";

import { useState } from "react";
import { useQuickNotes } from "@/lib/notes/useQuickNotes";

export default function QuickNotesSection() {
  const { notes, loaded, addNote, deleteNote, analyseNote } = useQuickNotes();
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
    const note = await addNote(finalContent);
    if (shouldAnalyse && note) {
      setAnalysing(note.id);
      await analyseNote(note.id);
      setAnalysing(null);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-200">Quick notes</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Jot something down… (try /analyse your note for AI feedback)"
          rows={2}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="submit"
          className="self-end rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          Add note
        </button>
      </form>

      {!loaded && <p className="text-sm text-slate-500">Loading…</p>}

      <ul className="flex flex-col gap-2">
        {notes.map((note) => (
          <li
            key={note.id}
            className="rounded-lg border border-slate-800 bg-slate-950 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-sm text-slate-100">{note.content}</p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => {
                    setAnalysing(note.id);
                    analyseNote(note.id).finally(() => setAnalysing(null));
                  }}
                  disabled={analysing === note.id}
                  className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-indigo-300 disabled:opacity-50"
                >
                  {analysing === note.id ? "Analysing…" : "Analyse"}
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="rounded-lg px-2 py-1 text-slate-500 hover:text-rose-400"
                  aria-label="Delete note"
                >
                  ✕
                </button>
              </div>
            </div>
            {note.aiAnalysis && (
              <div className="mt-2 border-l-2 border-indigo-400 bg-slate-800 pl-3 py-2 text-sm text-slate-300">
                {note.aiAnalysis}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
