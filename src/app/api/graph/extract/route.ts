import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";

interface ExtractedConcept { label: string; type: string; }
interface ExtractedEdge { source: string; target: string; }
interface ExtractionResult { nodes: ExtractedConcept[]; edges: ExtractedEdge[]; }

const VALID_TYPES = ["activity","emotion","person","concept","anxiety","achievement","place"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { content, date } = await request.json() as { content: string; date: string };
  if (!content) return Response.json({ error: "No content" }, { status: 400 });

  const client = getClaudeClient();
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `Extract the 5-15 most meaningful concepts from this journal entry and return ONLY valid JSON.
Types: activity (things done), emotion (feelings), person (names), concept (ideas/themes), anxiety (worries/triggers), achievement (accomplishments), place (locations).
Return: {"nodes": [{"label": "string", "type": "one of the types above"}], "edges": [{"source": "label", "target": "label"}]}
Edges connect concepts that appear together meaningfully. Be selective — quality over quantity.`,
    messages: [{ role: "user", content }],
  });

  let extracted: ExtractionResult = { nodes: [], edges: [] };
  const text = msg.content.find(b => b.type === "text")?.text ?? "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) extracted = JSON.parse(jsonMatch[0]) as ExtractionResult;
  } catch { /* use empty default */ }

  const validNodes = (extracted.nodes ?? []).filter(n => n.label && VALID_TYPES.includes(n.type));

  // Upsert each node: increment weight if exists, insert if not
  const nodeIdMap: Record<string, string> = {};
  for (const n of validNodes) {
    const { data: existing } = await supabase
      .from("graph_nodes")
      .select("id, weight")
      .eq("user_id", user.id)
      .ilike("label", n.label)
      .eq("type", n.type)
      .maybeSingle();

    if (existing) {
      await supabase.from("graph_nodes").update({ weight: existing.weight + 1 }).eq("id", existing.id);
      nodeIdMap[n.label.toLowerCase()] = existing.id;
    } else {
      const { data } = await supabase
        .from("graph_nodes")
        .insert({ user_id: user.id, label: n.label, type: n.type, weight: 1 })
        .select("id").single();
      if (data) nodeIdMap[n.label.toLowerCase()] = data.id;
    }
  }

  // Upsert edges between co-occurring nodes
  for (const e of extracted.edges ?? []) {
    const srcId = nodeIdMap[e.source?.toLowerCase()];
    const tgtId = nodeIdMap[e.target?.toLowerCase()];
    if (!srcId || !tgtId || srcId === tgtId) continue;

    const { data: existingEdge } = await supabase
      .from("graph_edges")
      .select("id, strength")
      .eq("user_id", user.id)
      .or(`and(source_id.eq.${srcId},target_id.eq.${tgtId}),and(source_id.eq.${tgtId},target_id.eq.${srcId})`)
      .maybeSingle();

    if (existingEdge) {
      const newStrength = Math.min(1, existingEdge.strength + 0.1);
      await supabase.from("graph_edges").update({ strength: newStrength }).eq("id", existingEdge.id);
    } else {
      await supabase.from("graph_edges")
        .insert({ user_id: user.id, source_id: srcId, target_id: tgtId, strength: 0.3 });
    }
  }

  return Response.json({ ok: true, extracted: validNodes.length, date });
}
