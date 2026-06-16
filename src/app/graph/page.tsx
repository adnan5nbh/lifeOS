"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useGraph } from "@/lib/graph/useGraph";
import { useMindspace } from "@/lib/mindspace/useMindspace";
import { useJournal } from "@/lib/notes/useJournal";
import { GraphNode, NodeType, FilterState } from "@/lib/graph/types";
import FilterPanel from "@/components/graph/FilterPanel";
import NodeSidePanel from "@/components/graph/NodeSidePanel";
import AddNodeModal from "@/components/graph/AddNodeModal";

const GraphCanvas = dynamic(() => import("@/components/graph/GraphCanvas"), { ssr: false });

export default function GraphPage() {
  const graph = useGraph();
  const { checkins } = useMindspace();
  useJournal();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<FilterState>({ types: [], dateRange: null });
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [clusterRunning, setClusterRunning] = useState(false);
  const [sidePanel, setSidePanel] = useState<"filter" | "node">("filter");

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setSidePanel("node");
  }, []);

  async function runClusters() {
    setClusterRunning(true);
    try {
      const res = await fetch("/api/graph/clusters", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.clusters) {
          await graph.saveClusters(data.clusters);
        }
      }
    } finally {
      setClusterRunning(false);
    }
  }

  // Time slider: compute unique months from node created_at
  const months = Array.from(new Set(
    graph.nodes
      .filter(n => n.created_at)
      .map(n => n.created_at!.slice(0, 7))
      .sort()
  ));
  const sliderMin = 0;
  const sliderMax = Math.max(0, months.length - 1);
  const sliderValue = timeFilter ? months.indexOf(timeFilter) : sliderMax;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Graph canvas — takes remaining space */}
      <div className="relative flex-1">
        {!graph.loaded ? (
          <div className="flex h-full items-center justify-center bg-black">
            <p className="text-sm text-slate-500">Loading graph…</p>
          </div>
        ) : graph.nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-black text-center px-6">
            <p className="text-2xl">🕸️</p>
            <p className="text-sm text-slate-300 font-medium">Your knowledge graph is empty</p>
            <p className="text-xs text-slate-500 max-w-xs">Write journal entries and they&apos;ll automatically populate your graph. Or add a node manually.</p>
            <button
              onClick={() => setShowAddNode(true)}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
            >
              + Add First Node
            </button>
          </div>
        ) : (
          <GraphCanvas
            nodes={graph.nodes}
            edges={graph.edges}
            clusters={graph.clusters}
            filter={filter}
            timeFilter={timeFilter}
            selectedNodeId={selectedNode?.id ?? null}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* Toolbar overlay */}
        <div className="absolute left-3 top-3 flex gap-2">
          <button
            onClick={() => { setSidePanel("filter"); }}
            className="rounded-lg border border-slate-600/60 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 backdrop-blur hover:bg-slate-800"
          >
            ⚙ Filter
          </button>
          <button
            onClick={() => setShowAddNode(true)}
            className="rounded-lg border border-slate-600/60 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 backdrop-blur hover:bg-slate-800"
          >
            + Add Node
          </button>
        </div>

        {/* Time slider */}
        {months.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-72 rounded-xl border border-slate-700/60 bg-slate-900/85 px-4 py-3 backdrop-blur">
            <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>Time</span>
              <span>{timeFilter ?? "All time"}</span>
              {timeFilter && (
                <button onClick={() => setTimeFilter(null)} className="text-indigo-400 hover:underline">Reset</button>
              )}
            </div>
            <input
              type="range" min={sliderMin} max={sliderMax} step={1}
              value={sliderValue < 0 ? sliderMax : sliderValue}
              onChange={e => setTimeFilter(months[Number(e.target.value)] ?? null)}
              className="w-full accent-indigo-500"
            />
            <div className="mt-0.5 flex justify-between text-[9px] text-slate-600">
              <span>{months[0]}</span><span>{months[months.length - 1]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Side panel */}
      <div className="hidden w-64 flex-shrink-0 overflow-y-auto border-l border-slate-700 bg-slate-950 sm:block">
        {sidePanel === "node" && selectedNode ? (
          <NodeSidePanel
            node={selectedNode}
            checkins={checkins}
            onClose={() => { setSelectedNode(null); setSidePanel("filter"); }}
            onDelete={async (id) => { await graph.deleteNode(id); setSelectedNode(null); setSidePanel("filter"); }}
            onRename={async (id, label) => { await graph.renameNode(id, label); setSelectedNode(prev => prev ? { ...prev, label } : null); }}
          />
        ) : (
          <div className="p-4">
            <FilterPanel
              filter={filter}
              onChange={setFilter}
              clusters={graph.clusters}
              nodeCount={graph.nodes.length}
              edgeCount={graph.edges.length}
              onRunClusters={runClusters}
              clusterRunning={clusterRunning}
            />
          </div>
        )}
      </div>

      {showAddNode && (
        <AddNodeModal
          onAdd={(label: string, type: NodeType) => { graph.addNode(label, type); }}
          onClose={() => setShowAddNode(false)}
        />
      )}

      {/* Mobile: bottom drawer for side panel when node selected */}
      {selectedNode && (
        <div className="fixed inset-x-0 bottom-16 z-20 max-h-64 overflow-y-auto rounded-t-2xl border-t border-slate-700 bg-slate-950 sm:hidden">
          <NodeSidePanel
            node={selectedNode}
            checkins={checkins}
            onClose={() => setSelectedNode(null)}
            onDelete={async (id) => { await graph.deleteNode(id); setSelectedNode(null); }}
            onRename={async (id, label) => { await graph.renameNode(id, label); setSelectedNode(prev => prev ? { ...prev, label } : null); }}
          />
        </div>
      )}
    </div>
  );
}
