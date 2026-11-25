"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Toolkit = {
  slug: string;
  name: string;
  logo: string | null;
  connected: boolean;
};

export default function ConnectorsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/connectors/status");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load connectors");
      } else {
        setToolkits(json.toolkits);
      }
    } catch {
      setError("Could not reach the server");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setReady(true);
        load();
      }
    });
  }, [router, load]);

  // Refresh the list when you come back to this tab after signing in
  useEffect(() => {
    function onFocus() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  function connect(slug: string) {
    window.location.href = `/api/connectors/connect?toolkit=${encodeURIComponent(
      slug
    )}`;
  }

  if (!ready) {
    return <main className="p-6">Loading...</main>;
  }

  const connected = toolkits.filter((t) => t.connected);
  const available = toolkits.filter((t) => !t.connected);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connectors</h1>
        <p className="mt-1 text-sm text-muted">
          Link your apps. You sign in on a secure page, and your passwords and
          tokens are never stored in this app.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Connected</h2>
        {loading && toolkits.length === 0 ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : connected.length === 0 ? (
          <p className="text-sm text-muted">Nothing connected yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {connected.map((t) => (
              <li
                key={t.slug}
                className="flex items-center gap-3 rounded-lg border border-accent/50 bg-surface-2 px-3 py-2"
              >
                {t.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logo} alt="" className="h-6 w-6 rounded" />
                )}
                <span className="flex-1 font-medium">{t.name}</span>
                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-foreground">
                  Connected
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Available apps</h2>
        {loading && toolkits.length === 0 ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {available.map((t) => (
              <li
                key={t.slug}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2"
              >
                {t.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logo} alt="" className="h-6 w-6 rounded" />
                )}
                <span className="flex-1 font-medium">{t.name}</span>
                <button
                  onClick={() => connect(t.slug)}
                  className="btn-ghost !px-3 !py-1 text-xs"
                >
                  Connect
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
