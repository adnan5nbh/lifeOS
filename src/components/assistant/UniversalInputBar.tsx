"use client";

import { usePathname, useRouter } from "next/navigation";

export default function UniversalInputBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login" || pathname === "/chat") return null;

  return (
    <button
      onClick={() => router.push("/chat")}
      className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-2xl text-white shadow-xl transition hover:bg-indigo-400 sm:bottom-5"
      aria-label="Open chat"
    >
      💬
    </button>
  );
}
