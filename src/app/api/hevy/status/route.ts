import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const apiKey = process.env.HEVY_API_KEY;
  const configured = !!(apiKey && apiKey !== "YOUR_KEY_HERE");

  if (!configured) {
    return NextResponse.json({ configured: false, workoutCount: 0, lastSync: null });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ configured, workoutCount: 0, lastSync: null });
  }

  const [{ count }, { data: latest }] = await Promise.all([
    supabase
      .from("hevy_workouts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("hevy_workouts")
      .select("synced_at")
      .eq("user_id", user.id)
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    configured,
    workoutCount: count ?? 0,
    lastSync: (latest as { synced_at: string } | null)?.synced_at ?? null,
  });
}
