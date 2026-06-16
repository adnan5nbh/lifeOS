import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await request.json();
  if (!content) return Response.json({ ok: true });

  try {
    const client = getClaudeClient();
    const msg = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Extract the key concept labels from this journal entry. Return ONLY a JSON array of strings (concept names), nothing else:\n\n${content}`,
        },
      ],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return Response.json({ ok: true });

    let labels: string[] = [];
    try {
      const match = textBlock.text.match(/\[[\s\S]*\]/);
      labels = match ? JSON.parse(match[0]) : [];
    } catch {
      return Response.json({ ok: true });
    }

    for (const label of labels) {
      if (typeof label !== "string") continue;
      const { data: nodes } = await supabase
        .from("graph_nodes")
        .select("id, weight")
        .ilike("label", label)
        .eq("user_id", user.id);

      for (const node of nodes ?? []) {
        const newWeight = (node.weight as number) - 1;
        if (newWeight <= 0) {
          await supabase.from("graph_nodes").delete().eq("id", node.id);
        } else {
          await supabase.from("graph_nodes").update({ weight: newWeight }).eq("id", node.id);
        }
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("cleanup-entry error:", err);
    return Response.json({ ok: true });
  }
}
