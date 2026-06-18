import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?error=google_auth_failed", request.url));
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/settings?error=token_exchange_failed", request.url));
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  // Preserve existing refresh_token if Google didn't issue a new one
  let refreshToken = tokens.refresh_token ?? null;
  if (!refreshToken) {
    const { data: existing } = await supabase
      .from("google_fit_tokens")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();
    refreshToken = (existing as { refresh_token: string | null } | null)?.refresh_token ?? null;
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase.from("google_fit_tokens").upsert(
    {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return NextResponse.redirect(new URL("/settings?connected=1", request.url));
}
