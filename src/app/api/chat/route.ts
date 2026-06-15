import { createClient } from "@/lib/supabase/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";
import { todayKey, lastNDays } from "@/lib/health/utils";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await request.json();
  if (!message || typeof message !== "string") {
    return Response.json({ error: "Missing message" }, { status: 400 });
  }

  await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: message });

  const recentDays = lastNDays(7);

  const [{ data: events }, { data: healthLogs }, { data: goals }, { data: journal }, { data: history }] =
    await Promise.all([
      supabase
        .from("calendar_events")
        .select("title, date, start_time, end_time, kind")
        .order("date", { ascending: true }),
      supabase
        .from("health_logs")
        .select("date, steps, exercises, food")
        .in("date", recentDays),
      supabase
        .from("health_goals")
        .select("step_goal, calorie_goal, protein_goal")
        .maybeSingle(),
      supabase
        .from("journal_entries")
        .select("date, content")
        .order("date", { ascending: false })
        .limit(5),
      supabase
        .from("chat_messages")
        .select("role, content")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const systemParts = [
    `Today's date is ${todayKey()}.`,
    "You are LifeOS's personal assistant. You have access to the user's calendar, health, and journal data below. Use it to give personalised insights, spot patterns, and help set smart goals. Answer naturally and concisely.",
  ];

  if (events && events.length > 0) {
    systemParts.push(
      "Calendar events:\n" +
        events
          .map((e) => `- ${e.date} ${e.start_time}-${e.end_time}: ${e.title} (${e.kind})`)
          .join("\n")
    );
  }

  if (healthLogs && healthLogs.length > 0) {
    systemParts.push(
      "Recent health logs (last 7 days):\n" +
        healthLogs
          .map((log) => {
            const calories = (log.food ?? []).reduce((s: number, f: { calories: number }) => s + f.calories, 0);
            const protein = (log.food ?? []).reduce((s: number, f: { protein: number }) => s + f.protein, 0);
            return `- ${log.date}: ${log.steps} steps, ${calories} kcal, ${protein}g protein, ${(log.exercises ?? []).length} exercises logged`;
          })
          .join("\n")
    );
  }

  if (goals) {
    systemParts.push(
      `Goals: ${goals.step_goal} steps/day, ${goals.calorie_goal} kcal/day, ${goals.protein_goal}g protein/day.`
    );
  }

  if (journal && journal.length > 0) {
    systemParts.push(
      "Recent journal entries:\n" +
        journal.map((j) => `- ${j.date}: ${j.content}`).join("\n")
    );
  }

  const system = systemParts.join("\n\n");

  const conversationHistory = (history ?? [])
    .slice()
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  try {
    const client = getClaudeClient();
    const stream = client.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system,
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
          const textBlock = final.content.find((block) => block.type === "text");
          const assistantText = textBlock?.type === "text" ? textBlock.text : "";
          await supabase
            .from("chat_messages")
            .insert({ user_id: user.id, role: "assistant", content: assistantText });
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
