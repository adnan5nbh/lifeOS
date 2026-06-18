import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tokenRow } = await supabase
    .from("google_fit_tokens")
    .select("access_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (tokenRow) {
    const t = tokenRow as { access_token: string };
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(t.access_token)}`, {
      method: "POST",
    }).catch(() => {});
  }

  await supabase.from("google_fit_tokens").delete().eq("user_id", user.id);
  return Response.json({ ok: true });
}
