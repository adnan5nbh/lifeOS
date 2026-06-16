"use client";

import { useState } from "react";
import { NodeType, NODE_COLORS, NODE_TYPE_LABELS } from "@/lib/graph/types";

const ALL_TYPES: NodeType[] = ["activity","emotion","person","concept","anxiety","achievement","place"];

interface Props {
  onAdd: (label: string, type: NodeType) => void;
  onClose: () => void;
}

export default function AddNodeModal({ onAdd, onClose }: Props) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<NodeType>("concept");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-80 rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Add Node</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Node label…"
          className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
          autoFocus
          onKeyDown={e => { if (e.key === "Enter" && label.trim()) { onAdd(label.trim(), type); onClose(); } }}
        />
        <div className="mb-4 grid grid-cols-2 gap-1.5">
          {ALL_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition"
              style={{
                background: type === t ? NODE_COLORS[t] + "22" : "transparent",
                border: `1px solid ${type === t ? NODE_COLORS[t] : "#334155"}`,
                color: type === t ? NODE_COLORS[t] : "#94a3b8",
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: NODE_COLORS[t] }} />
              {NODE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-600 py-1.5 text-sm text-slate-400 hover:bg-slate-800">Cancel</button>
          <button
            onClick={() => { if (label.trim()) { onAdd(label.trim(), type); onClose(); } }}
            disabled={!label.trim()}
            className="flex-1 rounded-lg bg-indigo-500 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
