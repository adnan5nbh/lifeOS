import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";
import { ASSISTANT_TOOLS, AssistantAction } from "@/lib/claude/tools";
import { todayKey, lastNDays } from "@/lib/health/utils";

const ACTIONS_MARKER = "\n\n[[LIFEOS_TOOL_CALLS]]\n";

// Static instructions are sent once and cached by Claude's prompt caching
const STATIC_INSTRUCTIONS = `You are LifeOS's personal assistant. You can both have conversations AND take actions — creating journal entries, logging food/exercise, adding calendar events, updating steps, editing or deleting entries, and managing the knowledge graph. When the user asks you to do something, use the appropriate tools. When they want to talk or ask questions, respond conversationally. Always provide a brief text response alongside any tool calls so the user knows what's happening (e.g. "Adding that calendar event now…" or "Done! I've logged your meal.").

For destructive actions (delete_journal_entry, delete_graph_node, clear_all_graph_nodes): first describe what you will do in text and ask the user to confirm before calling the tool. Only call destructive tools once the user has explicitly agreed in their message (e.g. "yes", "go ahead", "confirm", "delete it").`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, localDate, image } = await request.json();
  if (!message || typeof message !== "string") {
    return Response.json({ error: "Missing message" }, { status: 400 });
  }
  const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
  type ValidMimeType = (typeof validMimeTypes)[number];
  const imageAttachment =
    image &&
    typeof image.base64 === "string" &&
    validMimeTypes.includes(image.mimeType as ValidMimeType)
      ? { mimeType: image.mimeType as ValidMimeType, base64: image.base64 as string }
      : null;

  await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: message });

  // Topic detection — only fetch and send relevant context sections
  const msgLower = message.toLowerCase();
  const topicHealth = /\b(exercise|workout|gym|step|calorie|food|ate|eat|protein|weight|run|walk|ran|walked|fitness|diet|nutrition|meal|breakfast|lunch|dinner|fat|carb|log)\b/.test(msgLower);
  const topicCalendar = /\b(calendar|schedule|event|appointment|plan|when|tomorrow|next week|remind|meeting|agenda|deadline)\b/.test(msgLower);
  const topicJournal = /\b(journal|mood|feel|feeling|anxious|stress|reflect|note|emotion|anxiety|worry|mental|emotional)\b/.test(msgLower);
  const topicSpecific = topicHealth || topicCalendar || topicJournal;

  // If a specific topic is detected, only include relevant sections to save tokens
  const needsHealth = !topicSpecific || topicHealth;
  const needsCalendar = !topicSpecific || topicCalendar;
  const needsJournal = !topicSpecific || topicJournal;

  const today = localDate || todayKey();
  const recentDays = lastNDays(7);

  // Calendar: only last 7 days through next 90 days (not all historical events)
  const pastCutoff = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const futureCutoff = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  })();

  const [eventsRes, healthRes, goalsRes, journalRes, historyRes, journalIdsRes] = await Promise.all([
    needsCalendar
      ? supabase
          .from("calendar_events")
          .select("title, date, start_time, end_time, kind")
          .gte("date", pastCutoff)
          .lte("date", futureCutoff)
          .order("date", { ascending: true })
          .limit(25)
      : Promise.resolve({ data: null }),
    needsHealth
      ? supabase.from("health_logs").select("date, steps, exercises, food").in("date", recentDays)
      : Promise.resolve({ data: null }),
    supabase.from("health_goals").select("step_goal, calorie_goal, protein_goal").maybeSingle(),
    needsJournal
      ? supabase.from("journal_entries").select("date, content").order("date", { ascending: false }).limit(5)
      : Promise.resolve({ data: null }),
    supabase.from("chat_messages").select("role, content").order("created_at", { ascending: false }).limit(20),
    needsJournal
      ? supabase.from("journal_entries").select("id, date, content").order("date", { ascending: false }).limit(10)
      : Promise.resolve({ data: null }),
  ]);

  const { data: events } = eventsRes;
  const { data: healthLogs } = healthRes;
  const { data: goals } = goalsRes;
  const { data: journal } = journalRes;
  const { data: history } = historyRes;
  const { data: journalWithIds } = journalIdsRes;

  // Build dynamic context (fresh per-request, not cached)
  const dynamicParts: string[] = [`Today's date is ${today}.`];

  if (events && events.length > 0) {
    dynamicParts.push(
      "Upcoming calendar events:\n" +
        events.map((e) => `- ${e.date} ${e.start_time}-${e.end_time}: ${e.title} (${e.kind})`).join("\n")
    );
  }

  if (healthLogs && healthLogs.length > 0) {
    dynamicParts.push(
      "Health logs (last 7 days):\n" +
        healthLogs
          .map((log) => {
            const calories = (log.food ?? []).reduce((s: number, f: { calories: number }) => s + f.calories, 0);
            const protein = (log.food ?? []).reduce((s: number, f: { protein: number }) => s + f.protein, 0);
            return `- ${log.date}: ${log.steps} steps, ${calories} kcal, ${protein}g protein, ${(log.exercises ?? []).length} exercises`;
          })
          .join("\n")
    );
  }

  if (goals) {
    dynamicParts.push(
      `Goals: ${goals.step_goal} steps/day, ${goals.calorie_goal} kcal/day, ${goals.protein_goal}g protein/day.`
    );
  }

  if (journal && journal.length > 0) {
    dynamicParts.push(
      "Recent journal entries:\n" + journal.map((j) => `- ${j.date}: ${j.content}`).join("\n")
    );
  }

  if (journalWithIds && journalWithIds.length > 0) {
    dynamicParts.push(
      "Journal entries with IDs (use for edit/delete):\n" +
        journalWithIds
          .map((j: { id: string; date: string; content: string }) => `- [ID: ${j.id}] ${j.date}: ${j.content.slice(0, 150)}`)
          .join("\n")
    );
  }

  const dynamicContext = dynamicParts.join("\n\n");

  // Static instructions get cached by Claude (saves tokens on repeat messages)
  const systemContent: Anthropic.Messages.TextBlockParam[] = [
    { type: "text", text: STATIC_INSTRUCTIONS, cache_control: { type: "ephemeral" } },
    { type: "text", text: dynamicContext },
  ];

  const conversationHistory = (history ?? [])
    .slice()
    .reverse()
    .map((m, i, arr) => {
      if (imageAttachment && i === arr.length - 1 && m.role === "user") {
        return {
          role: "user" as const,
          content: [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: imageAttachment.mimeType,
                data: imageAttachment.base64,
              },
            },
            { type: "text" as const, text: m.content },
          ],
        };
      }
      return { role: m.role as "user" | "assistant", content: m.content };
    });

  try {
    const client = getClaudeClient();
    const stream = client.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: systemContent,
      tools: ASSISTANT_TOOLS,
      messages: conversationHistory,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          const final = await stream.finalMessage();

          const textBlock = final.content.find((b) => b.type === "text");
          const assistantText = textBlock?.type === "text" ? textBlock.text : "";

          const actions: AssistantAction[] = [];
          for (const block of final.content) {
            if (block.type === "tool_use") {
              actions.push({ type: block.name, ...(block.input as Record<string, unknown>) } as AssistantAction);
            }
          }

          if (actions.length > 0) {
            controller.enqueue(encoder.encode(ACTIONS_MARKER + JSON.stringify(actions)));
          }

          await supabase.from("chat_messages").insert({
            user_id: user.id,
            role: "assistant",
            content:
              assistantText ||
              (actions.length > 0 ? `(${actions.length} action${actions.length > 1 ? "s" : ""} taken)` : "(no response)"),
          });
        } catch (err) {
          console.error("Claude chat stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Claude chat error:", error);
    return Response.json({ error: "Failed to chat" }, { status: 500 });
  }
}
