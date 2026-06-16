import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { nodeId } = await request.json() as { nodeId: string };
  if (!nodeId) return Response.json({ error: "No nodeId" }, { status: 400 });

  const { data: node } = await supabase
    .from("graph_nodes").select("*").eq("id", nodeId).eq("user_id", user.id).single();
  if (!node) return Response.json({ error: "Node not found" }, { status: 404 });

  // Get journal entries mentioning this concept
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, date, content, ai_analysis")
    .eq("user_id", user.id)
    .ilike("content", `%${node.label}%`)
    .order("date", { ascending: false })
    .limit(15);

  // Get co-occurring nodes (connected edges)
  const { data: edgesFrom } = await supabase
    .from("graph_edges").select("target_id, strength").eq("source_id", nodeId).eq("user_id", user.id);
  const { data: edgesTo } = await supabase
    .from("graph_edges").select("source_id, strength").eq("target_id", nodeId).eq("user_id", user.id);

  const connectedIds = [
    ...((edgesFrom ?? []).map((e: Record<string, unknown>) => e.target_id as string)),
    ...((edgesTo ?? []).map((e: Record<string, unknown>) => e.source_id as string)),
  ];

  const { data: connectedNodes } = connectedIds.length > 0
    ? await supabase.from("graph_nodes").select("label").in("id", connectedIds)
    : { data: [] };

  const coOccurring = (connectedNodes ?? []).map((n: Record<string, unknown>) => n.label as string);
  const entryTexts = (entries ?? []).map((e: Record<string, unknown>) => `[${e.date}] ${e.content}`).join("\n\n");

  const client = getClaudeClient();
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: "You are a compassionate psychological analyst. Analyse what this concept means to the user based on their journal entries. Be insightful, personal, and constructive. 2-3 paragraphs max.",
    messages: [{
      role: "user",
      content: `Concept: "${node.label}" (type: ${node.type})\n\nJournal entries mentioning this:\n\n${entryTexts || "(No entries found)"}\n\nWhat does this concept mean to me and how has my relationship with it evolved?`,
    }],
  });

  const analysis = msg.content.find(b => b.type === "text")?.text ?? "";

  return Response.json({
    analysis,
    coOccurring,
    journalEntries: (entries ?? []).map((e: Record<string, unknown>) => ({ id: e.id, date: e.date, content: (e.content as string).slice(0, 200) })),
  });
}
