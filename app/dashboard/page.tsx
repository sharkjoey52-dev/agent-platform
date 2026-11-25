"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PROVIDER_NAMES } from "@/lib/providers";

type SavedKey = {
  id: string;
  provider: string;
  label: string | null;
  key_last4: string | null;
  created_at: string;
};

export default function KeysPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [keys, setKeys] = useState<SavedKey[]>([]);
  const [provider, setProvider] = useState(PROVIDER_NAMES[0]);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadKeys = useCallback(async () => {
    const res = await fetch("/api/keys");
    if (res.ok) {
      const json = await res.json();
      setKeys(json.keys);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setReady(true);
        loadKeys();
      }
    });
  }, [router, loadKeys]);

  async function saveKey(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, label, apiKey }),
    });
    const json = await res.json();

    if (res.ok) {
      setApiKey("");
      setLabel("");
      setMessage("Key saved.");
      loadKeys();
    } else {
      setMessage(json.error ?? "Something went wrong");
    }
    setSaving(false);
  }

  async function deleteKey(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
    } else {
      loadKeys();
    }
  }

  if (!ready) {
    return <main className="p-6">Loading...</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API keys</h1>
        <p className="mt-1 text-sm text-muted">
          Keys are encrypted before they are saved, and only the last 4
          characters are ever shown back to you.
        </p>
      </div>

      <section className="card flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Add an API key</h2>
        <form onSubmit={saveKey} className="flex flex-col gap-3">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="input"
          >
            {PROVIDER_NAMES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Label (optional, e.g. My main key)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input"
          />

          <input
            type="password"
            placeholder="Paste your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            autoComplete="off"
            className="input"
          />

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save key"}
          </button>
        </form>
        {message && <p className="text-sm text-yellow-400">{message}</p>}
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Your saved keys</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-muted">No keys saved yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {k.provider}
                    {k.label ? ` - ${k.label}` : ""}
                  </p>
                  <p className="text-sm text-muted">
                    ending in {k.key_last4 ?? "????"}
                  </p>
                </div>
                <button
                  onClick={() => deleteKey(k.id)}
                  className="shrink-0 text-sm text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
