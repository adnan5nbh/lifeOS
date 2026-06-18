"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch("/api/fit/status")
      .then(r => r.json())
      .then((d: { connected: boolean; lastSync: string | null }) => {
        setConnected(d.connected);
        setLastSync(d.lastSync);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    // Handle redirect params from OAuth flow
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      setConnected(true);
      setSyncResult("Google Fit connected successfully!");
      window.history.replaceState({}, "", "/settings");
    } else if (params.get("error")) {
      setSyncResult("Failed to connect Google Fit. Please try again.");
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/fit/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean; syncedDays?: number; error?: string };
      if (data.ok) {
        setSyncResult(`Synced ${data.syncedDays} day${data.syncedDays !== 1 ? "s" : ""} of data.`);
        setLastSync(new Date().toISOString());
      } else {
        setSyncResult(data.error ?? "Sync failed.");
      }
    } catch {
      setSyncResult("Sync failed. Check your connection.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Google Fit? Synced data will remain in LifeOS.")) return;
    setDisconnecting(true);
    try {
      await fetch("/api/auth/google/disconnect", { method: "POST" });
      setConnected(false);
      setLastSync(null);
      setSyncResult("Google Fit disconnected.");
    } finally {
      setDisconnecting(false);
    }
  }

  function formatLastSync(iso: string | null): string {
    if (!iso) return "Never";
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="flex flex-1 justify-center bg-slate-950">
      <main className="flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
        <header>
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
          <p className="text-sm text-slate-400">Manage integrations and preferences</p>
        </header>

        {/* Google Fit integration */}
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">🏃</span>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Google Fit</h2>
              <p className="text-xs text-slate-400">Sync steps, sleep, heart rate, and active minutes</p>
            </div>
            {loaded && (
              <span
                className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  connected
                    ? "bg-emerald-900/60 text-emerald-300"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {connected ? "Connected" : "Not connected"}
              </span>
            )}
          </div>

          {!loaded && (
            <p className="text-sm text-slate-500">Checking connection…</p>
          )}

          {loaded && !connected && (
            <a
              href="/api/auth/google"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect Google Fit
            </a>
          )}

          {loaded && connected && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500">
                Last synced: {formatLastSync(lastSync)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {syncing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Syncing…
                    </span>
                  ) : (
                    "↻ Sync Now"
                  )}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="rounded-lg border border-rose-700 px-4 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-900/30 disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {syncResult && (
            <p className={`mt-3 text-sm ${syncResult.includes("failed") || syncResult.includes("Failed") ? "text-rose-400" : "text-emerald-400"}`}>
              {syncResult}
            </p>
          )}

          <div className="mt-4 rounded-lg bg-slate-800/50 p-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">What gets synced:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Daily step count</li>
              <li>Sleep duration (light, deep, REM)</li>
              <li>Average heart rate</li>
              <li>Active minutes</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
