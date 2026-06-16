"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "./navLinks";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-700 bg-slate-900 pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex overflow-x-auto scrollbar-none">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-w-[4.2rem] flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition"
              style={{ color: active ? "#818cf8" : "#64748b" }}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span>{link.label}</span>
              {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-indigo-400" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
