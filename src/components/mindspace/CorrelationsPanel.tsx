"use client";

import { CorrelationInsight } from "@/lib/mindspace/types";

interface Props {
  insights: CorrelationInsight[];
  loading: boolean;
  generating: boolean;
  onGenerate: () => void;
  onReact: (id: string, reaction: "makes_sense" | "surprising") => void;
}

export default function CorrelationsPanel({ insights, loading, generating, onGenerate, onReact }: Props) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Patterns & Insights</h2>
          <p className="text-[11px] text-slate-500">Claude analyses your data weekly</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-50 transition"
        >
          {generating ? "Analysing…" : "✨ Generate Insights"}
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : insights.length === 0 ? (
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 text-center">
          <p className="text-sm text-slate-400">No insights yet.</p>
          <p className="mt-1 text-xs text-slate-500">Log check-ins and health data for a week, then generate your first analysis.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {insights.map(insight => (
            <div key={insight.id} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
              <p className="mb-2 text-sm leading-relaxed text-slate-300">{insight.content}</p>
              <div className="flex items-center gap-2">
                {insight.reaction ? (
                  <span className="text-[11px] text-slate-500">
                    {insight.reaction === "makes_sense" ? "✅ Makes sense" : "😮 Surprising"}
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => onReact(insight.id, "makes_sense")}
                      className="rounded-full border border-slate-600 px-2.5 py-0.5 text-[11px] text-slate-400 hover:border-green-500 hover:text-green-400"
                    >
                      ✅ Makes sense
                    </button>
                    <button
                      onClick={() => onReact(insight.id, "surprising")}
                      className="rounded-full border border-slate-600 px-2.5 py-0.5 text-[11px] text-slate-400 hover:border-amber-500 hover:text-amber-400"
                    >
                      😮 Surprising
                    </button>
                  </>
                )}
                <span className="ml-auto text-[10px] text-slate-600">
                  {new Date(insight.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
