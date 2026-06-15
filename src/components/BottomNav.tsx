"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "./navLinks";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-700 bg-slate-900 pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="grid grid-cols-5">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                active ? "text-indigo-300" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              <span className="truncate px-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
