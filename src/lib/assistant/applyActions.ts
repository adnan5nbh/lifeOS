import { AssistantAction } from "@/lib/claude/tools";
import { useEvents } from "@/lib/calendar/useEvents";
import { useHealthData } from "@/lib/health/useHealthData";
import { useQuickNotes } from "@/lib/notes/useQuickNotes";
import { useJournal } from "@/lib/notes/useJournal";

export interface AssistantHooks {
  events: ReturnType<typeof useEvents>;
  health: ReturnType<typeof useHealthData>;
  notes: ReturnType<typeof useQuickNotes>;
  journal: ReturnType<typeof useJournal>;
}

export interface AppliedAction {
  action: AssistantAction;
  status: "applied" | "failed";
  summary: string;
  error?: string;
  undo?: () => Promise<void>;
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
