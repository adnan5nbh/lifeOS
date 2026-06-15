"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!email) return null;

  return (
    <div className="ml-auto flex items-center gap-3 text-sm">
      <span className="hidden text-slate-400 sm:inline">{email}</span>
      <button
        onClick={handleLogout}
        className="rounded-lg px-3 py-1.5 font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
      >
        Log out
      </button>
    </div>
  );
}
