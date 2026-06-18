import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ connected: false });

  const { data } = await supabase
    .from("google_fit_tokens")
    .select("expires_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return Response.json({
    connected: !!data,
    lastSync: (data as { updated_at?: string } | null)?.updated_at ?? null,
  });
}
