import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";

function lastNDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = lastNDays(30);

  const [checkinsRes, logsRes, journalRes] = await Promise.all([
    supabase.from("mindspace_checkins").select("*").eq("user_id", user.id).gte("date", cutoff).order("date"),
    supabase.from("health_logs").select("date, steps, exercises, food").eq("user_id", user.id).gte("date", cutoff).order("date"),
    supabase.from("journal_entries").select("date, content").eq("user_id", user.id).gte("date", cutoff).order("date").limit(20),
  ]);

  const checkins = (checkinsRes.data ?? []) as Record<string, unknown>[];
  const logs = (logsRes.data ?? []) as Record<string, unknown>[];
  const journal = (journalRes.data ?? []) as Record<string, unknown>[];

  if (checkins.length < 3 && logs.length < 3) {
    return Response.json({ insights: [], message: "Not enough data yet — keep logging for a week and try again." });
  }

  const checkinSummary = checkins.map(c =>
    `${c.date}: valence=${Number(c.valence).toFixed(2)}, arousal=${Number(c.arousal).toFixed(2)}, ` +
    `PERMA avg=${((Number(c.perma_p)+Number(c.perma_e)+Number(c.perma_r)+Number(c.perma_m)+Number(c.perma_a))/5).toFixed(1)}, ` +
    `cog_load=${c.cognitive_load}`
  ).join("\n");

  const healthSummary = logs.map(l =>
    `${l.date}: steps=${l.steps}, exercises=${(l.exercises as unknown[])?.length ?? 0}, calories=${(l.food as Record<string, unknown>[])?.reduce((s, f) => s + (Number(f.calories) || 0), 0) ?? 0}`
  ).join("\n");

  const client = getClaudeClient();
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    system: `You are a compassionate data analyst helping someone understand psychological patterns in their own data.
Generate 3-5 specific, data-backed insights. Each insight should:
- Reference specific numbers or patterns from the data
- Be actionable or illuminating
- Be honest but encouraging
Return ONLY valid JSON: {"insights": [{"content": "Your insight here"}]}`,
    messages: [{
      role: "user",
      content: `Last 30 days of emotional check-ins:\n${checkinSummary}\n\nHealth data:\n${healthSummary}\n\nJournal themes: ${journal.slice(0,5).map(j => String(j.content).slice(0,100)).join(" | ")}\n\nWhat patterns do you see?`,
    }],
  });

  const text = msg.content.find(b => b.type === "text")?.text ?? "";
  let rawInsights: { content: string }[] = [];
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) rawInsights = (JSON.parse(jsonMatch[0]) as { insights: { content: string }[] }).insights ?? [];
  } catch { /* use empty */ }

  if (rawInsights.length === 0) return Response.json({ insights: [] });

  const rows = rawInsights.map(i => ({ user_id: user.id, content: i.content }));
  const { data } = await supabase.from("correlation_insights").insert(rows).select();

  return Response.json({ insights: data ?? [] });
}
