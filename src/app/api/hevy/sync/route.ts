import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface HevySet {
  index: number;
  set_type: string;
  weight_kg: number | null;
  reps: number | null;
}

interface HevyExercise {
  index: number;
  title: string;
  exercise_template_id: string;
  sets: HevySet[];
}

interface HevyWorkout {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  exercises: HevyExercise[];
}

interface HevyResponse {
  page: number;
  page_count: number;
  workout_count: number;
  workouts: HevyWorkout[];
}

type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "abs"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

function guessMuscle(name: string): MuscleGroup {
  const n = name.toLowerCase();
  if (/tricep|skull.?crush|pushdown|overhead.?ext/.test(n)) return "triceps";
  if (/bicep|curl/.test(n) && !/leg.?curl/.test(n)) return "biceps";
  if (/calf|calves|standing.?calf|seated.?calf/.test(n)) return "calves";
  if (/glute|hip.?thrust|bridge|kickback/.test(n)) return "glutes";
  if (/hamstring|rdl|romanian|leg.?curl|good.?morning/.test(n)) return "hamstrings";
  if (/squat|leg.?press|lunge|leg.?ext|hack|quad/.test(n)) return "quads";
  if (/ab|core|crunch|plank|sit.?up|leg.?raise|oblique/.test(n)) return "abs";
  if (/shoulder|delt|lateral.?raise|front.?raise|face.?pull|ohp|upright/.test(n)) return "shoulders";
  if (/lat|pull.?down|pull.?up|chin.?up|row|t-bar|seated.?cable|deadlift/.test(n)) return "back";
  if (/bench|chest|pec|fly|push.?up|dip/.test(n)) return "chest";
  return "chest";
}

function toUtcTimeStr(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.HEVY_API_KEY;
  if (!apiKey || apiKey === "YOUR_KEY_HERE") {
    return NextResponse.json({ error: "HEVY_API_KEY not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const full = url.searchParams.get("full") === "true";
  const maxPages = full ? 200 : 1;

  // Load existing hevy_ids so we can detect new vs updated workouts
  const { data: existing } = await supabase
    .from("hevy_workouts")
    .select("hevy_id, calendar_event_id")
    .eq("user_id", user.id);

  type ExistingRow = { hevy_id: string; calendar_event_id: string | null };
  const existingMap = new Map<string, string | null>(
    (existing as ExistingRow[] ?? []).map((r) => [r.hevy_id, r.calendar_event_id])
  );

  let newWorkouts = 0;
  let page = 1;
  let pageCount = 1;

  while (page <= pageCount && page <= maxPages) {
    const res = await fetch(
      `https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=10`,
      { headers: { "api-key": apiKey }, cache: "no-store" }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Hevy API error ${res.status}: ${text}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as HevyResponse;
    pageCount = data.page_count ?? 1;

    for (const workout of data.workouts) {
      const dateStr = workout.start_time.slice(0, 10);
      const startTimeStr = toUtcTimeStr(workout.start_time);
      const endTimeStr = toUtcTimeStr(workout.end_time);
      const durationSec = Math.max(
        0,
        Math.round(
          (new Date(workout.end_time).getTime() - new Date(workout.start_time).getTime()) / 1000
        )
      );

      const exercises = workout.exercises.map((ex) => ({
        name: ex.title,
        muscle: guessMuscle(ex.title),
        sets: ex.sets
          .filter((s) => s.reps !== null)
          .map((s) => ({
            reps: s.reps ?? 0,
            weight_kg: s.weight_kg ?? 0,
            set_type: s.set_type,
          })),
      }));

      const workoutTitle = workout.title || "Workout";

      if (!existingMap.has(workout.id)) {
        // New workout: create a calendar activity event
        const { data: calEvent } = await supabase
          .from("calendar_events")
          .insert({
            user_id: user.id,
            title: workoutTitle,
            date: dateStr,
            start_time: startTimeStr,
            end_time: endTimeStr,
            kind: "activity",
            recurrence: null,
            completed_dates: [],
          })
          .select("id")
          .single();

        await supabase.from("hevy_workouts").insert({
          user_id: user.id,
          hevy_id: workout.id,
          title: workoutTitle,
          date: dateStr,
          start_time: startTimeStr,
          end_time: endTimeStr,
          duration_seconds: durationSec,
          exercises,
          calendar_event_id: (calEvent as { id: string } | null)?.id ?? null,
          synced_at: new Date().toISOString(),
        });

        newWorkouts++;
      } else {
        // Workout already synced — update mutable fields in case user edited it in Hevy
        await supabase
          .from("hevy_workouts")
          .update({
            title: workoutTitle,
            duration_seconds: durationSec,
            exercises,
            synced_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("hevy_id", workout.id);
      }
    }

    page++;

    // For incremental syncs (not full), stop after first page
    if (!full) break;
  }

  const { count } = await supabase
    .from("hevy_workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json({
    ok: true,
    newWorkouts,
    totalWorkouts: count ?? 0,
    pagesScanned: page - 1,
  });
}
