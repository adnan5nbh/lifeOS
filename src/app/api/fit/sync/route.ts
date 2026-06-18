import { createClient } from "@/lib/supabase/server";

interface FitValue {
  intVal?: number;
  fpVal?: number;
}
interface FitPoint {
  startTimeNanos?: string;
  endTimeNanos?: string;
  value?: FitValue[];
}
interface FitDataset {
  dataSourceId?: string;
  point?: FitPoint[];
}
interface FitBucket {
  startTimeMillis: string;
  dataset?: FitDataset[];
}
interface TokenRow {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
}

async function getValidAccessToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("google_fit_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const row = data as TokenRow;

  // Token still valid (with 5-min buffer)
  if (new Date(row.expires_at) > new Date(Date.now() + 5 * 60 * 1000)) {
    return row.access_token;
  }

  // Need to refresh
  if (!row.refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const refreshed = await res.json() as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await supabase
    .from("google_fit_tokens")
    .update({ access_token: refreshed.access_token, expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return refreshed.access_token;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const accessToken = await getValidAccessToken(supabase, user.id);
  if (!accessToken) {
    return Response.json({ error: "Not connected to Google Fit" }, { status: 400 });
  }

  // Sync last 7 days
  const endMs = Date.now();
  const startMs = endMs - 7 * 24 * 60 * 60 * 1000;

  const fitRes = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: "com.google.step_count.delta" },
          { dataTypeName: "com.google.active_minutes" },
          { dataTypeName: "com.google.heart_rate.bpm" },
          { dataTypeName: "com.google.sleep.segment" },
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startMs.toString(),
        endTimeMillis: endMs.toString(),
      }),
    }
  );

  if (!fitRes.ok) {
    console.error("Google Fit API error:", await fitRes.text());
    return Response.json({ error: "Google Fit API error" }, { status: 502 });
  }

  const fitData = await fitRes.json() as { bucket?: FitBucket[] };
  const buckets = fitData.bucket ?? [];

  const syncedAt = new Date().toISOString();
  let syncedDays = 0;
  const SLEEP_STAGES = new Set([2, 4, 5, 6]);

  for (const bucket of buckets) {
    const bucketMs = parseInt(bucket.startTimeMillis);
    const d = new Date(bucketMs);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

    let steps = 0;
    let activeMinutes = 0;
    let heartRateBpm: number | undefined;
    let sleepMinutes = 0;

    for (const dataset of bucket.dataset ?? []) {
      const srcId = dataset.dataSourceId ?? "";
      const points = dataset.point ?? [];

      if (srcId.includes("step_count")) {
        steps = points.reduce((s, p) => s + (p.value?.[0]?.intVal ?? 0), 0);
      } else if (srcId.includes("active_minutes")) {
        activeMinutes = points.reduce((s, p) => s + (p.value?.[0]?.intVal ?? 0), 0);
      } else if (srcId.includes("heart_rate.bpm")) {
        const hrs = points.filter(p => (p.value?.[0]?.fpVal ?? 0) > 0);
        if (hrs.length > 0) {
          heartRateBpm = Math.round(
            (hrs.reduce((s, p) => s + (p.value?.[0]?.fpVal ?? 0), 0) / hrs.length) * 10
          ) / 10;
        }
      } else if (srcId.includes("sleep.segment")) {
        const sleepSec = points
          .filter(p => SLEEP_STAGES.has(p.value?.[0]?.intVal ?? 0))
          .reduce((s, p) => {
            const durSec = (parseInt(p.endTimeNanos ?? "0") - parseInt(p.startTimeNanos ?? "0")) / 1e9;
            return s + durSec;
          }, 0);
        sleepMinutes = Math.round(sleepSec / 60);
      }
    }

    const hasData = steps > 0 || activeMinutes > 0 || heartRateBpm !== undefined || sleepMinutes > 0;
    if (!hasData) continue;

    const googleFit = {
      stepsFromFit: steps > 0 ? steps : undefined,
      sleepMinutes: sleepMinutes > 0 ? sleepMinutes : undefined,
      activeMinutes: activeMinutes > 0 ? activeMinutes : undefined,
      heartRateBpm,
      syncedAt,
    };

    // Fetch existing log to preserve manually entered exercises + food
    const { data: existing } = await supabase
      .from("health_logs")
      .select("steps, exercises, food")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle();

    const existingRow = existing as { steps: number; exercises: unknown[]; food: unknown[] } | null;

    // Prefer Google Fit steps when we have them; otherwise keep manual entry
    const finalSteps = steps > 0 ? steps : (existingRow?.steps ?? 0);

    await supabase.from("health_logs").upsert(
      {
        user_id: user.id,
        date: dateStr,
        steps: finalSteps,
        exercises: existingRow?.exercises ?? [],
        food: existingRow?.food ?? [],
        google_fit: googleFit,
      },
      { onConflict: "user_id,date" }
    );

    syncedDays++;
  }

  // Update the sync timestamp on the token row
  await supabase
    .from("google_fit_tokens")
    .update({ updated_at: syncedAt })
    .eq("user_id", user.id);

  return Response.json({ ok: true, syncedDays, syncedAt });
}
