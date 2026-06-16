import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";

interface ClusterResult { label: string; node_labels: string[]; color: string; }

const CLUSTER_COLORS = ["#6366f1","#22c55e","#f97316","#ec4899","#eab308","#3b82f6","#a855f7"];

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: nodes }, { data: edges }] = await Promise.all([
    supabase.from("graph_nodes").select("id, label, type, weight").eq("user_id", user.id),
    supabase.from("graph_edges").select("source_id, target_id, strength").eq("user_id", user.id),
  ]);

  if (!nodes || nodes.length < 4) return Response.json({ clusters: [] });

  const nodeList = (nodes as Record<string, unknown>[]).map(n => `${n.label} (${n.type})`).join(", ");
  const edgeList = (edges as Record<string, unknown>[] ?? []).map(e => {
    const src = (nodes as Record<string, unknown>[]).find(n => n.id === e.source_id);
    const tgt = (nodes as Record<string, unknown>[]).find(n => n.id === e.target_id);
    return src && tgt ? `${src.label}↔${tgt.label} (${Number(e.strength).toFixed(2)})` : null;
  }).filter(Boolean).join(", ");

  const client = getClaudeClient();
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: `Identify 3-6 meaningful psychological clusters from this knowledge graph. Return ONLY valid JSON:
{"clusters": [{"label": "Cluster Name", "node_labels": ["node1", "node2"], "color": "#hexcolor"}]}
Labels should be psychologically meaningful (e.g. "High Performance Zone", "Social Anxiety Cluster", "Creative Flow").
Each node can only appear in one cluster. Include only nodes that clearly belong together.`,
    messages: [{
      role: "user",
      content: `Nodes: ${nodeList}\n\nConnections: ${edgeList}`,
    }],
  });

  let rawClusters: ClusterResult[] = [];
  const text = msg.content.find(b => b.type === "text")?.text ?? "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) rawClusters = (JSON.parse(jsonMatch[0]) as { clusters: ClusterResult[] }).clusters ?? [];
  } catch { /* use empty */ }

  // Map node labels back to IDs
  const nodeMap = new Map((nodes as Record<string, unknown>[]).map(n => [String(n.label).toLowerCase(), n.id as string]));
  const clusters = rawClusters
    .map((c, i) => ({
      label: c.label,
      color: c.color || CLUSTER_COLORS[i % CLUSTER_COLORS.length],
      node_ids: (c.node_labels ?? []).map(l => nodeMap.get(l.toLowerCase())).filter(Boolean) as string[],
    }))
    .filter(c => c.node_ids.length >= 2);

  // Save clusters
  await supabase.from("graph_clusters").delete().eq("user_id", user.id);
  if (clusters.length > 0) {
    await supabase.from("graph_clusters")
      .insert(clusters.map(c => ({ ...c, user_id: user.id })));
  }

  return Response.json({ clusters });
}
