"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GraphNode, GraphEdge, GraphCluster, NodeType } from "./types";

function edgeRowToEdge(row: Record<string, unknown>): GraphEdge {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    source: row.source_id as string,
    target: row.target_id as string,
    source_id: row.source_id as string,
    target_id: row.target_id as string,
    strength: row.strength as number,
    created_at: row.created_at as string,
  };
}

export function useGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [clusters, setClusters] = useState<GraphCluster[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const [nodesRes, edgesRes, clustersRes] = await Promise.all([
        supabase.from("graph_nodes").select("*").order("created_at"),
        supabase.from("graph_edges").select("*"),
        supabase.from("graph_clusters").select("*"),
      ]);
      if (cancelled) return;
      if (nodesRes.data) setNodes(nodesRes.data as GraphNode[]);
      if (edgesRes.data) setEdges((edgesRes.data as Record<string, unknown>[]).map(edgeRowToEdge));
      if (clustersRes.data) setClusters(clustersRes.data as GraphCluster[]);
      if (!cancelled) setLoaded(true);
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addNode(label: string, type: NodeType): Promise<GraphNode | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const existing = nodes.find(n => n.label.toLowerCase() === label.toLowerCase() && n.type === type);
    if (existing) {
      const { data } = await supabase
        .from("graph_nodes").update({ weight: existing.weight + 1 }).eq("id", existing.id).select().single();
      if (data) {
        const updated = data as GraphNode;
        setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
        return updated;
      }
      return existing;
    }
    const { data } = await supabase
      .from("graph_nodes").insert({ user_id: user.id, label, type, weight: 1 }).select().single();
    if (!data) return null;
    const node = data as GraphNode;
    setNodes(prev => [...prev, node]);
    return node;
  }

  async function deleteNode(id: string): Promise<void> {
    await supabase.from("graph_nodes").delete().eq("id", id);
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => {
      const s = typeof e.source === "string" ? e.source : (e.source as GraphNode).id;
      const t = typeof e.target === "string" ? e.target : (e.target as GraphNode).id;
      return s !== id && t !== id;
    }));
  }

  async function renameNode(id: string, label: string): Promise<void> {
    await supabase.from("graph_nodes").update({ label }).eq("id", id);
    setNodes(prev => prev.map(n => n.id === id ? { ...n, label } : n));
  }

  async function upsertEdge(sourceId: string, targetId: string, strengthDelta = 0.15): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const existing = edges.find(e => {
      const s = typeof e.source === "string" ? e.source : (e.source as GraphNode).id;
      const t = typeof e.target === "string" ? e.target : (e.target as GraphNode).id;
      return (s === sourceId && t === targetId) || (s === targetId && t === sourceId);
    });
    if (existing) {
      const newStrength = Math.min(1, existing.strength + strengthDelta);
      await supabase.from("graph_edges").update({ strength: newStrength }).eq("id", existing.id);
      setEdges(prev => prev.map(e => e.id === existing.id ? { ...e, strength: newStrength } : e));
    } else {
      const { data } = await supabase
        .from("graph_edges")
        .insert({ user_id: user.id, source_id: sourceId, target_id: targetId, strength: 0.3 })
        .select().single();
      if (data) setEdges(prev => [...prev, edgeRowToEdge(data as Record<string, unknown>)]);
    }
  }

  async function saveClusters(newClusters: Omit<GraphCluster, "id">[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("graph_clusters").delete().eq("user_id", user.id);
    if (newClusters.length === 0) { setClusters([]); return; }
    const { data } = await supabase.from("graph_clusters")
      .insert(newClusters.map(c => ({ ...c, user_id: user.id }))).select();
    if (data) setClusters(data as GraphCluster[]);
  }

  async function clearAll(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("graph_clusters").delete().eq("user_id", user.id);
    await supabase.from("graph_edges").delete().eq("user_id", user.id);
    await supabase.from("graph_nodes").delete().eq("user_id", user.id);
    setClusters([]);
    setEdges([]);
    setNodes([]);
  }

  return { nodes, edges, clusters, loaded, addNode, deleteNode, renameNode, upsertEdge, saveClusters, clearAll };
}
