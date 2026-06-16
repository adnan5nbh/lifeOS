import Anthropic from "@anthropic-ai/sdk";
import { MuscleGroup } from "@/lib/health/types";
import { Recurrence } from "@/lib/calendar/types";

export type AssistantAction =
  | {
      type: "add_calendar_event";
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      kind: "event" | "activity";
      recurrence?: Recurrence;
    }
  | {
      type: "log_food";
      name: string;
      calories: number;
      protein: number;
      carbs?: number;
      fat?: number;
      servingSize?: string;
    }
  | {
      type: "log_exercise";
      name: string;
      muscle: MuscleGroup;
      sets: { reps: number; weight: number }[];
    }
  | {
      type: "add_journal_entry";
      date: string;
      content: string;
    }
  | {
      type: "add_quick_note";
      content: string;
    }
  | {
      type: "update_steps";
      steps: number;
      mode: "set" | "increment";
    }
  | {
      type: "delete_graph_node";
      nodeLabel: string;
    }
  | {
      type: "clear_all_graph_nodes";
    }
  | {
      type: "edit_journal_entry";
      id: string;
      date: string;
      content: string;
    }
  | {
      type: "delete_journal_entry";
      id: string;
    };

const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "abs",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
];

export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "add_calendar_event",
    description: "Add an event or activity to the user's calendar.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short title for the event." },
        date: { type: "string", description: "Anchor date in YYYY-MM-DD format." },
        startTime: { type: "string", description: "Start time in HH:MM (24h) format." },
        endTime: { type: "string", description: "End time in HH:MM (24h) format." },
        kind: { type: "string", enum: ["event", "activity"], description: "Whether this is a general event or a health activity." },
        recurrence: {
          type: "object",
          description: "Optional recurrence rule.",
          properties: {
            freq: { type: "string", enum: ["daily", "weekly"] },
            daysOfWeek: { type: "array", items: { type: "number" }, description: "0=Sunday..6=Saturday, only for weekly." },
            until: { type: "string", description: "Optional inclusive end date YYYY-MM-DD." },
          },
          required: ["freq"],
        },
      },
      required: ["title", "date", "startTime", "endTime", "kind"],
    },
  },
  {
    name: "log_food",
    description: "Log a food item the user ate, with its nutrition info.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the food item." },
        calories: { type: "number", description: "Calories in kcal." },
        protein: { type: "number", description: "Protein in grams." },
        carbs: { type: "number", description: "Carbohydrates in grams." },
        fat: { type: "number", description: "Fat in grams." },
        servingSize: { type: "string", description: "Serving size description, e.g. '100g' or '1 bar'." },
      },
      required: ["name", "calories", "protein"],
    },
  },
  {
    name: "log_exercise",
    description: "Log a workout exercise with its sets.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the exercise." },
        muscle: { type: "string", enum: MUSCLE_GROUPS, description: "Primary muscle group worked." },
        sets: {
          type: "array",
          description: "Sets performed.",
          items: {
            type: "object",
            properties: {
              reps: { type: "number" },
              weight: { type: "number" },
            },
            required: ["reps", "weight"],
          },
          minItems: 1,
        },
      },
      required: ["name", "muscle", "sets"],
    },
  },
  {
    name: "add_journal_entry",
    description: "Add a journal entry for the user.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date for the entry in YYYY-MM-DD format." },
        content: { type: "string", description: "The journal entry text." },
      },
      required: ["date", "content"],
    },
  },
  {
    name: "add_quick_note",
    description: "Add a short quick note for the user.",
    input_schema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The note text." },
      },
      required: ["content"],
    },
  },
  {
    name: "update_steps",
    description: "Set or increment the user's step count for today.",
    input_schema: {
      type: "object",
      properties: {
        steps: { type: "number", description: "Number of steps." },
        mode: { type: "string", enum: ["set", "increment"], description: "Whether 'steps' replaces or is added to today's total." },
      },
      required: ["steps", "mode"],
    },
  },
  {
    name: "delete_graph_node",
    description: "Delete a specific node from the user's knowledge graph by its label name. Always ask the user to confirm before calling this.",
    input_schema: {
      type: "object",
      properties: {
        nodeLabel: { type: "string", description: "The label name of the node to delete." },
      },
      required: ["nodeLabel"],
    },
  },
  {
    name: "clear_all_graph_nodes",
    description: "Clear ALL nodes, edges, and clusters from the user's knowledge graph. This is irreversible — always confirm with the user before calling this.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "edit_journal_entry",
    description: "Edit an existing journal entry by its ID, updating its date and content.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the journal entry to edit." },
        date: { type: "string", description: "The new date for the entry in YYYY-MM-DD format." },
        content: { type: "string", description: "The new content for the entry." },
      },
      required: ["id", "date", "content"],
    },
  },
  {
    name: "delete_journal_entry",
    description: "Delete a journal entry by its ID. Always ask the user to confirm before calling this.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the journal entry to delete." },
      },
      required: ["id"],
    },
  },
];
