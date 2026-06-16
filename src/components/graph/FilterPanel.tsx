"use client";

import { NodeType, NODE_COLORS, NODE_TYPE_LABELS, FilterState } from "@/lib/graph/types";
import { GraphCluster } from "@/lib/graph/types";

const ALL_TYPES: NodeType[] = ["activity","emotion","person","concept","anxiety","achievement","place"];

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  clusters: GraphCluster[];
  nodeCount: number;
  edgeCount: number;
  onRunClusters: () => void;
  clusterRunning: boolean;
}

export default function FilterPanel({ filter, onChange, clusters, nodeCount, edgeCount, onRunClusters, clusterRunning }: Props) {
  function toggleType(type: NodeType) {
    const types = filter.types.includes(type)
      ? filter.types.filter(t => t !== type)
      : [...filter.types, type];
    onChange({ ...filter, types });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Filter by Type</p>
        <div className="flex flex-col gap-1.5">
          {ALL_TYPES.map(type => {
            const active = filter.types.length === 0 || filter.types.includes(type);
            const color = NODE_COLORS[type];
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-slate-800"
                style={{ opacity: active ? 1 : 0.35 }}
              >
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                <span className="text-slate-300">{NODE_TYPE_LABELS[type]}</span>
              </button>
            );
          })}
          {filter.types.length > 0 && (
            <button
              onClick={() => onChange({ ...filter, types: [] })}
              className="mt-1 text-[11px] text-indigo-400 hover:underline text-left"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-slate-700/50 pt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Clusters</p>
        <button
          onClick={onRunClusters}
          disabled={clusterRunning || nodeCount < 4}
          className="w-full rounded-lg border border-slate-600 py-1.5 text-xs text-slate-400 hover:border-indigo-500 hover:text-indigo-300 disabled:opacity-40 transition"
        >
          {clusterRunning ? "Detecting…" : "✦ Detect Clusters"}
        </button>
        {clusters.map(c => (
          <div key={c.id} className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
            <span className="text-[11px] text-slate-400">{c.label}</span>
            <span className="ml-auto text-[11px] text-slate-600">{c.node_ids.length}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700/50 pt-3 text-[11px] text-slate-500 space-y-0.5">
        <p>{nodeCount} nodes · {edgeCount} connections</p>
        <p className="text-slate-600">Drag nodes · Scroll to zoom</p>
      </div>
    </div>
  );
}
