"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Skill = {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
};

const STARTERS = [
  {
    name: "Friendly tone",
    description: "Warm, simple, encouraging",
    instructions:
      "Write in a warm, friendly tone. Use simple words and short sentences. Be encouraging.",
  },
  {
    name: "Step-by-step helper",
    description: "One step at a time",
    instructions:
      "When explaining how to do something, give one step at a time, then wait for the user to confirm before giving the next step.",
  },
  {
    name: "Brief answers",
    description: "Short and to the point",
    instructions:
      "Keep answers short and to the point. Use bullet points where it helps. Skip long introductions.",
  },
];

export default function SkillsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("skills")
      .select("id, name, description, instructions")
      .order("created_at", { ascending: false });
    if (data) setSkills(data);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUserId(data.user.id);
        load();
      }
    });
  }, [router, load]);

  async function saveSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("skills").insert({
      user_id: userId,
      name: name.trim(),
      description: description.trim() || null,
      instructions: instructions.trim(),
    });

    if (error) {
      setMessage(error.message);
    } else {
      setName("");
      setDescription("");
      setInstructions("");
      setMessage("Skill saved.");
      load();
    }
    setSaving(false);
  }

  async function deleteSkill(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("skills").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
    } else {
      load();
    }
  }

  function useStarter(s: (typeof STARTERS)[number]) {
    setName(s.name);
    setDescription(s.description);
    setInstructions(s.instructions);
    setMessage("");
  }

  if (userId === null) {
    return <main className="p-6">Loading...</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
        <p className="mt-1 text-sm text-muted">
          Reusable instructions you can attach to any agent.
        </p>
      </div>

      <section className="card flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Create a skill</h2>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Start from:</span>
          {STARTERS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => useStarter(s)}
              className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs transition hover:border-accent"
            >
              {s.name}
            </button>
          ))}
        </div>

        <form onSubmit={saveSkill} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Skill name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input"
          />
          <input
            type="text"
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
          />
          <textarea
            placeholder="Instructions the agent should follow"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            required
            rows={5}
            className="input"
          />
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save skill"}
          </button>
        </form>
        {message && <p className="text-sm text-yellow-400">{message}</p>}
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Your skills</h2>
        {skills.length === 0 ? (
          <p className="text-sm text-muted">No skills yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {skills.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium">{s.name}</p>
                  {s.description && (
                    <p className="text-sm text-muted">{s.description}</p>
                  )}
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {s.instructions}
                  </p>
                </div>
                <button
                  onClick={() => deleteSkill(s.id)}
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
