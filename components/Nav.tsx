"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/chat", label: "Chat" },
  { href: "/agents", label: "Agents" },
  { href: "/skills", label: "Skills" },
  { href: "/connectors", label: "Connectors" },
  { href: "/dashboard", label: "Keys" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  // No navigation bar on the landing page or the login page
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/menu" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-5 w-5 rounded-md bg-accent" />
            <span className="hidden sm:inline">AgentHub</span>
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            {LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "rounded-md bg-surface-2 px-3 py-1.5 text-sm text-foreground"
                      : "rounded-md px-3 py-1.5 text-sm text-muted transition hover:text-foreground"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <button
          onClick={signOut}
          className="shrink-0 text-sm text-muted transition hover:text-foreground"
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}
