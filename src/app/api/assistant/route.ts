import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";
import { ASSISTANT_TOOLS, AssistantAction } from "@/lib/claude/tools";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const text: string | undefined = body.text;
  const image: { mimeType: string; base64: string } | undefined = body.image;
  const foodLookup = body.foodLookup;
  const localDate: string | undefined = body.localDate;

  if (!text && !image) {
    return Response.json({ error: "Provide text or an image" }, { status: 400 });
  }

  const content: Anthropic.MessageParam["content"] = [];

  let textBlock = text?.trim() || "";
  if (foodLookup) {
    textBlock += `\n\nOpen Food Facts lookup result: ${JSON.stringify(foodLookup)}`;
  }
  if (textBlock) {
    content.push({ type: "text", text: textBlock });
  }
  if (image && ALLOWED_IMAGE_TYPES.includes(image.mimeType)) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: image.base64,
      },
    });
  }
  if (content.length === 0) {
    content.push({ type: "text", text: "(no content)" });
  }

  const today = localDate || new Date().toISOString().slice(0, 10);
  const system = `You are LifeOS's assistant. Today's date (in the user's local timezone) is ${today}. The user may send text, a voice transcript, and/or an image. Use the provided tools to record any actionable items: calendar events, food/exercise logs, journal entries, quick notes, or step updates. You may call multiple tools in one response if appropriate. If the image is a food package and "log_food" is appropriate, extract nutrition info from the image or from the provided Open Food Facts data. Resolve relative dates/times (e.g. "tomorrow", "next Monday") against today's date. If nothing actionable is present, respond with a brief text message and do not call any tools.`;

  try {
    const client = getClaudeClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system,
      tools: ASSISTANT_TOOLS,
      messages: [{ role: "user", content }],
    });

    const actions: AssistantAction[] = [];
    let responseMessage: string | null = null;

    for (const block of message.content) {
      if (block.type === "tool_use") {
        actions.push({ type: block.name, ...(block.input as object) } as AssistantAction);
      } else if (block.type === "text" && block.text.trim()) {
        responseMessage = (responseMessage ? responseMessage + "\n" : "") + block.text.trim();
      }
    }

    return Response.json({ actions, message: responseMessage });
  } catch (error) {
    console.error("Claude assistant error:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}
