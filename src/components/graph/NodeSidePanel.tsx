"use client";

import { useState } from "react";
import { GraphNode, NODE_COLORS, NODE_TYPE_LABELS } from "@/lib/graph/types";
import { DailyCheckin } from "@/lib/mindspace/types";

interface Props {
  node: GraphNode;
  checkins: DailyCheckin[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, label: string) => void;
}

export default function NodeSidePanel({ node, checkins, onClose, onDelete, onRename }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [coOccurring, setCoOccurring] = useState<string[]>([]);
  const [journalEntries, setJournalEntries] = useState<{id: string; date: string; content: string}[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newLabel, setNewLabel] = useState(node.label);

  const color = NODE_COLORS[node.type] ?? "#6366f1";

  async function analyse() {
    setAnalysing(true);
    try {
      const res = await fetch("/api/graph/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
        setCoOccurring(data.coOccurring ?? []);
        setJournalEntries(data.journalEntries ?? []);
      }
    } finally {
      setAnalysing(false);
    }
  }

  // Emotional fingerprint from checkins on days when journal entries mentioning this node were written
  const mentionDates = new Set(journalEntries.map(e => e.date));
  const relevantCheckins = checkins.filter(c => mentionDates.has(c.date));
  const avgValence = relevantCheckins.length > 0
    ? relevantCheckins.reduce((s, c) => s + c.valence, 0) / relevantCheckins.length : null;
  const avgArousal = relevantCheckins.length > 0
    ? relevantCheckins.reduce((s, c) => s + c.arousal, 0) / relevantCheckins.length : null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          {renaming ? (
            <input
              className="rounded bg-slate-800 px-2 py-0.5 text-sm text-slate-100 border border-slate-600 focus:outline-none"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") { onRename(node.id, newLabel); setRenaming(false); }
                if (e.key === "Escape") setRenaming(false);
              }}
              autoFocus
            />
          ) : (
            <h2 className="text-base font-semibold text-slate-100">{node.label}</h2>
          )}
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full px-2.5 py-0.5 font-medium" style={{ background: color + "22", color }}>
          {NODE_TYPE_LABELS[node.type]}
        </span>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-slate-400">
          Weight: {node.weight}
        </span>
        <button
          onClick={() => setRenaming(r => !r)}
          className="rounded-full bg-slate-800 px-2.5 py-0.5 text-slate-400 hover:text-slate-200"
        >
          ✏️ Rename
        </button>
        <button
          onClick={() => { if (confirm(`Delete "${node.label}"?`)) onDelete(node.id); }}
          className="rounded-full bg-rose-900/40 px-2.5 py-0.5 text-rose-400 hover:bg-rose-900/60"
        >
          🗑 Delete
        </button>
      </div>

      {avgValence !== null && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-xs">
          <p className="mb-1 font-semibold text-slate-300">Emotional Fingerprint</p>
          <div className="flex gap-4">
            <span>Valence: <span style={{ color: avgValence > 0 ? "#22c55e" : "#ef4444" }}>
              {avgValence > 0 ? "+" : ""}{(avgValence * 100).toFixed(0)}%
            </span></span>
            {avgArousal !== null && (
              <span>Arousal: <span className="text-indigo-300">
                {avgArousal > 0 ? "+" : ""}{(avgArousal * 100).toFixed(0)}%
              </span></span>
            )}
          </div>
          <p className="mt-1 text-slate-500">from {relevantCheckins.length} matching check-in{relevantCheckins.length !== 1 ? "s" : ""}</p>
        </div>
      )}

      {coOccurring.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-400">Most Connected To</p>
          <div className="flex flex-wrap gap-1.5">
            {coOccurring.slice(0, 8).map(label => (
              <span key={label} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{label}</span>
            ))}
          </div>
        </div>
      )}

      {journalEntries.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-400">Journal Entries ({journalEntries.length})</p>
          <div className="flex flex-col gap-2">
            {journalEntries.slice(0, 4).map(e => (
              <div key={e.id} className="rounded-lg border border-slate-700 bg-slate-800/40 p-2">
                <p className="mb-0.5 text-[10px] text-slate-500">{e.date}</p>
                <p className="text-xs text-slate-300 line-clamp-3">{e.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis ? (
        <div className="rounded-lg border-l-2 bg-slate-800/50 p-3" style={{ borderColor: color }}>
          <p className="mb-1 text-xs font-semibold" style={{ color }}>Claude&apos;s Analysis</p>
          <p className="text-xs leading-relaxed text-slate-300">{analysis}</p>
        </div>
      ) : (
        <button
          onClick={analyse}
          disabled={analysing}
          className="rounded-lg border border-slate-600 py-2 text-sm text-slate-400 hover:border-indigo-500 hover:text-indigo-300 disabled:opacity-50 transition"
        >
          {analysing ? "Analysing…" : "✨ Analyse This Node"}
        </button>
      )}
    </div>
  );
}
