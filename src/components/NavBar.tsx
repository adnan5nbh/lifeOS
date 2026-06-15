"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthStatus from "./AuthStatus";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/", label: "Schedule" },
  { href: "/health", label: "Health & Fitness" },
];

export default function NavBar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="border-b border-slate-700 bg-slate-900">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-1 px-4 py-3">
        <span className="mr-2 text-sm font-bold text-slate-100">LifeOS</span>
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-indigo-900/60 text-indigo-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <AuthStatus />
      </div>
    </nav>
  );
}
