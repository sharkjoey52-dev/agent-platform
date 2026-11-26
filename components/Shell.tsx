"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/menu", label: "Menu", icon: "🏠" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/agents", label: "Agents", icon: "🤖" },
  { href: "/skills", label: "Skills", icon: "✨" },
  { href: "/connectors", label: "Connectors", icon: "🔌" },
  { href: "/dashboard", label: "API keys", icon: "🔑" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // The landing page, login page and chat page have their own layouts
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/chat")
  ) {
    return <>{children}</>;
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-1">
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/10 bg-[#1f1e1d] transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/menu" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-5 w-5 rounded-md bg-accent" />
            AgentHub
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="text-muted hover:text-white md:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="px-3">
          <Link
            href="/chat"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-[#e8a085] transition hover:bg-accent/25"
          >
            <span className="text-lg leading-none">+</span> New chat
          </Link>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-[#c2c0b6] hover:bg-white/5"
                }`}
              >
                <span className="w-5 text-center">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <button
            onClick={signOut}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg px-2 py-1 text-xl text-[#c2c0b6] hover:bg-white/5"
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="font-semibold">AgentHub</span>
        </header>
        {children}
      </div>
    </div>
  );
}
