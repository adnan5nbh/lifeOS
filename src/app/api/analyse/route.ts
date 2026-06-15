import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";

const SYSTEM_PROMPT =
  "You are LifeOS's reflective assistant. Given the user's note or journal entry, provide brief (2-4 sentence) supportive, insightful feedback: patterns you notice, gentle suggestions, or questions for reflection. Be concise and warm, not clinical.";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, kind } = await request.json();
  if (!content || typeof content !== "string") {
    return Response.json({ error: "Missing content" }, { status: 400 });
  }

  try {
    const client = getClaudeClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is my ${kind === "journal" ? "journal entry" : "note"}:\n\n${content}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const analysis = textBlock?.type === "text" ? textBlock.text : "";

    return Response.json({ analysis });
  } catch (error) {
    console.error("Claude analyse error:", error);
    return Response.json({ error: "Failed to analyse" }, { status: 500 });
  }
}
