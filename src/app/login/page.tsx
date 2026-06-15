"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6"
      >
        <h1 className="mb-1 text-lg font-bold text-slate-100">LifeOS</h1>
        <p className="mb-6 text-sm text-slate-400">Sign in to continue</p>

        <label className="mb-1 block text-sm font-medium text-slate-300" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-slate-300" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
        />

        {state?.error && (
          <p className="mb-4 text-sm text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
