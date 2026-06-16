import { AssistantAction } from "@/lib/claude/tools";
import { useEvents } from "@/lib/calendar/useEvents";
import { useHealthData } from "@/lib/health/useHealthData";
import { useQuickNotes } from "@/lib/notes/useQuickNotes";
import { useJournal } from "@/lib/notes/useJournal";
import { createClient } from "@/lib/supabase/client";

export interface AssistantHooks {
  events: ReturnType<typeof useEvents>;
  health: ReturnType<typeof useHealthData>;
  notes: ReturnType<typeof useQuickNotes>;
  journal: ReturnType<typeof useJournal>;
}

export interface AppliedAction {
  action: AssistantAction;
  status: "applied" | "failed" | "pending";
  summary: string;
  error?: string;
  undo?: () => Promise<void>;
  confirm?: () => Promise<AppliedAction>;
}

function describeAction(action: AssistantAction): string {
  switch (action.type) {
    case "add_calendar_event":
      return `Add "${action.title}" on ${action.date} ${action.startTime}-${action.endTime}`;
    case "log_food":
      return `Log food "${action.name}" (${action.calories} kcal, ${action.protein}g protein)`;
    case "log_exercise":
      return `Log exercise "${action.name}" (${action.sets.length} sets)`;
    case "add_journal_entry":
      return `Add journal entry for ${action.date}`;
    case "add_quick_note":
      return "Add quick note";
    case "update_steps":
      return `${action.mode === "set" ? "Set" : "Add"} ${action.steps} steps`;
    case "delete_graph_node":
      return `Delete graph node "${action.nodeLabel}"`;
    case "clear_all_graph_nodes":
      return "Clear all graph nodes and edges";
    case "edit_journal_entry":
      return `Edit journal entry`;
    case "delete_journal_entry":
      return `Delete journal entry`;
  }
}

export async function applyAction(action: AssistantAction, hooks: AssistantHooks): Promise<AppliedAction> {
  try {
    switch (action.type) {
      case "add_calendar_event": {
        const created = await hooks.events.addEvent({
          title: action.title,
          date: action.date,
          startTime: action.startTime,
          endTime: action.endTime,
          kind: action.kind,
          recurrence: action.recurrence,
        });
        if (!created) throw new Error("Failed to create event");
        return {
          action,
          status: "applied",
          summary: `Added "${action.title}" on ${action.date} ${action.startTime}-${action.endTime}`,
          undo: async () => {
            await hooks.events.deleteEvent(created.id);
          },
        };
      }

      case "log_food": {
        const id = crypto.randomUUID();
        await hooks.health.updateToday((log) => ({
          ...log,
          food: [
            ...log.food,
            {
              id,
              name: action.name,
              calories: action.calories,
              protein: action.protein,
              carbs: action.carbs,
              fat: action.fat,
              servingSize: action.servingSize,
            },
          ],
        }));
        return {
          action,
          status: "applied",
          summary: `Logged food "${action.name}" (${action.calories} kcal, ${action.protein}g protein)`,
          undo: async () => {
            await hooks.health.updateToday((log) => ({
              ...log,
              food: log.food.filter((f) => f.id !== id),
            }));
          },
        };
      }

      case "log_exercise": {
        const id = crypto.randomUUID();
        await hooks.health.updateToday((log) => ({
          ...log,
          exercises: [...log.exercises, { id, name: action.name, muscle: action.muscle, sets: action.sets }],
        }));
        return {
          action,
          status: "applied",
          summary: `Logged exercise "${action.name}" (${action.sets.length} sets)`,
          undo: async () => {
            await hooks.health.updateToday((log) => ({
              ...log,
              exercises: log.exercises.filter((e) => e.id !== id),
            }));
          },
        };
      }

      case "add_journal_entry": {
        const created = await hooks.journal.addEntry(action.date, action.content);
        if (!created) throw new Error("Failed to add journal entry");
        return {
          action,
          status: "applied",
          summary: `Added journal entry for ${action.date}`,
          undo: async () => {
            await hooks.journal.deleteEntry(created.id);
          },
        };
      }

      case "add_quick_note": {
        const created = await hooks.notes.addNote(action.content);
        if (!created) throw new Error("Failed to add note");
        return {
          action,
          status: "applied",
          summary: "Added quick note",
          undo: async () => {
            await hooks.notes.deleteNote(created.id);
          },
        };
      }

      case "update_steps": {
        const previous = hooks.health.todayLog.steps;
        await hooks.health.updateToday((log) => ({
          ...log,
          steps: action.mode === "set" ? action.steps : log.steps + action.steps,
        }));
        return {
          action,
          status: "applied",
          summary: `${action.mode === "set" ? "Set" : "Added"} ${action.steps} steps`,
          undo: async () => {
            await hooks.health.updateToday((log) => ({ ...log, steps: previous }));
          },
        };
      }

      case "delete_graph_node": {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { data: nodes } = await supabase
          .from("graph_nodes")
          .select("id, label")
          .ilike("label", action.nodeLabel)
          .eq("user_id", user.id)
          .limit(1);
        const node = nodes?.[0];
        if (!node) throw new Error(`Node "${action.nodeLabel}" not found in your graph`);
        const nodeId = node.id as string;
        const nodeLabel = node.label as string;
        return {
          action,
          status: "pending",
          summary: `Delete graph node "${nodeLabel}"`,
          confirm: async () => {
            try {
              const sb = createClient();
              await sb.from("graph_nodes").delete().eq("id", nodeId);
              return {
                action,
                status: "applied",
                summary: `Deleted graph node "${nodeLabel}". Refresh the Graph page to see changes.`,
              };
            } catch (err) {
              return {
                action,
                status: "failed",
                summary: `Delete graph node "${nodeLabel}"`,
                error: err instanceof Error ? err.message : String(err),
              };
            }
          },
        };
      }

      case "clear_all_graph_nodes": {
        return {
          action,
          status: "pending",
          summary: "Clear ALL nodes, edges, and clusters from your knowledge graph",
          confirm: async () => {
            try {
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("Not authenticated");
              await supabase.from("graph_clusters").delete().eq("user_id", user.id);
              await supabase.from("graph_edges").delete().eq("user_id", user.id);
              await supabase.from("graph_nodes").delete().eq("user_id", user.id);
              return {
                action,
                status: "applied",
                summary: "Cleared all graph nodes and edges. Refresh the Graph page to see changes.",
              };
            } catch (err) {
              return {
                action,
                status: "failed",
                summary: "Clear all graph nodes",
                error: err instanceof Error ? err.message : String(err),
              };
            }
          },
        };
      }

      case "edit_journal_entry": {
        const entry = hooks.journal.entries.find((e) => e.id === action.id);
        if (!entry) throw new Error("Journal entry not found");
        await hooks.journal.updateEntry(action.id, action.date, action.content);
        return {
          action,
          status: "applied",
          summary: `Edited journal entry for ${action.date}`,
        };
      }

      case "delete_journal_entry": {
        const entry = hooks.journal.entries.find((e) => e.id === action.id);
        if (!entry) throw new Error("Journal entry not found");
        const preview = entry.content.length > 60 ? entry.content.slice(0, 60) + "…" : entry.content;
        return {
          action,
          status: "pending",
          summary: `Delete journal entry from ${entry.date}: "${preview}"`,
          confirm: async () => {
            try {
              await hooks.journal.deleteEntry(action.id);
              return {
                action,
                status: "applied",
                summary: `Deleted journal entry from ${entry.date}`,
              };
            } catch (err) {
              return {
                action,
                status: "failed",
                summary: `Delete journal entry from ${entry.date}`,
                error: err instanceof Error ? err.message : String(err),
              };
            }
          },
        };
      }
    }
  } catch (err) {
    return {
      action,
      status: "failed",
      summary: describeAction(action),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
