"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AgentAvatar, {
  AVATAR_COLORS,
  AVATAR_STYLES,
  normColor,
  normStyle,
  type AvatarColor,
  type AvatarStyle,
} from "@/components/AgentAvatar";

type SavedKey = {
  id: string;
  provider: string;
  label: string | null;
  key_last4: string | null;
};

type Skill = {
  id: string;
  name: string;
};

type Agent = {
  id: string;
  name: string;
  model: string | null;
  system_prompt: string;
  api_key_id: string | null;
  skill_ids: string[];
  avatar_style: string | null;
  avatar_color: string | null;
};

const OTHER = "__other__";

function AvatarPicker({
  style,
  color,
  onChange,
}: {
  style: AvatarStyle;
  color: AvatarColor;
  onChange: (style: AvatarStyle, color: AvatarColor) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {AVATAR_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id, color)}
            className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition ${
              s.id === style
                ? "border-accent bg-accent/15"
                : "border-line bg-surface-2 hover:border-accent"
            }`}
          >
            <AgentAvatar style={s.id} color={color} size={36} />
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(style, c.id)}
            aria-label={c.label}
            title={c.label}
            className={`h-8 w-8 rounded-full border-2 transition ${
              c.id === color ? "border-white" : "border-transparent"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
        <span className="ml-1 text-xs text-muted">Thinking face:</span>
        <AgentAvatar style={style} color={color} size={36} thinking />
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [keys, setKeys] = useState<SavedKey[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant."
  );
  const [keyId, setKeyId] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [modelChoice, setModelChoice] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [newSkillIds, setNewSkillIds] = useState<string[]>([]);
  const [newStyle, setNewStyle] = useState<AvatarStyle>("bot");
  const [newColor, setNewColor] = useState<AvatarColor>("orange");
  const [editingLookId, setEditingLookId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveModel =
    modelChoice === OTHER ? customModel.trim() : modelChoice;

  const suggestions = useMemo(() => {
    const q = customModel.trim().toLowerCase();
    if (!q) return [];
    return models.filter((m) => m.toLowerCase().includes(q)).slice(0, 8);
  }, [customModel, models]);

  const exactMatch = models.includes(customModel.trim());

  const load = useCallback(async () => {
    const supabase = createClient();

    const keysRes = await supabase
      .from("api_keys")
      .select("id, provider, label, key_last4")
      .order("created_at", { ascending: false });
    if (keysRes.data) {
      setKeys(keysRes.data);
      setKeyId((current) => current || keysRes.data[0]?.id || "");
    }

    const skillsRes = await supabase
      .from("skills")
      .select("id, name")
      .order("created_at", { ascending: false });
    if (skillsRes.data) setSkills(skillsRes.data);

    const agentsRes = await supabase
      .from("agents")
      .select(
        "id, name, model, system_prompt, api_key_id, skill_ids, avatar_style, avatar_color"
      )
      .order("created_at", { ascending: false });
    if (agentsRes.data) setAgents(agentsRes.data);
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

  // Load the model list whenever the chosen key changes
  useEffect(() => {
    if (!keyId) return;
    let cancelled = false;

    async function loadModels() {
      setModelsLoading(true);
      setModelsError("");
      setModels([]);
      setModelChoice("");
      setCustomModel("");

      try {
        const res = await fetch(`/api/models?keyId=${encodeURIComponent(keyId)}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setModelsError(json.error ?? "Could not load models");
          setModelChoice(OTHER);
        } else {
          setModels(json.models);
        }
      } catch {
        if (!cancelled) {
          setModelsError("Could not reach the server");
          setModelChoice(OTHER);
        }
      }
      if (!cancelled) setModelsLoading(false);
    }

    loadModels();
    return () => {
      cancelled = true;
    };
  }, [keyId]);

  function toggleNewSkill(id: string) {
    setNewSkillIds((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    if (!effectiveModel) {
      setMessage("Choose a model first.");
      return;
    }

    setSaving(true);
    setMessage("");

    const chosen = keys.find((k) => k.id === keyId);
    const supabase = createClient();
    const { error } = await supabase.from("agents").insert({
      user_id: userId,
      name: name.trim(),
      system_prompt: systemPrompt.trim() || "You are a helpful assistant.",
      provider: chosen?.provider ?? null,
      model: effectiveModel,
      api_key_id: keyId || null,
      skill_ids: newSkillIds,
      avatar_style: newStyle,
      avatar_color: newColor,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setName("");
      setNewSkillIds([]);
      setMessage("Agent created.");
      load();
    }
    setSaving(false);
  }

  async function changeLook(
    agent: Agent,
    style: AvatarStyle,
    color: AvatarColor
  ) {
    // Update the screen straight away, then save
    setAgents((current) =>
      current.map((a) =>
        a.id === agent.id
          ? { ...a, avatar_style: style, avatar_color: color }
          : a
      )
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("agents")
      .update({ avatar_style: style, avatar_color: color })
      .eq("id", agent.id);

    if (error) {
      setMessage(error.message);
      load();
    }
  }

  async function toggleAgentSkill(agent: Agent, skillId: string) {
    const next = agent.skill_ids.includes(skillId)
      ? agent.skill_ids.filter((s) => s !== skillId)
      : [...agent.skill_ids, skillId];

    setAgents((current) =>
      current.map((a) => (a.id === agent.id ? { ...a, skill_ids: next } : a))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("agents")
      .update({ skill_ids: next })
      .eq("id", agent.id);

    if (error) {
      setMessage(error.message);
      load();
    }
  }

  async function deleteAgent(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
    } else {
      load();
    }
  }

  function chipClass(active: boolean) {
    return active
      ? "rounded-full border border-accent bg-accent/20 px-3 py-1 text-xs text-foreground transition"
      : "rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-muted transition hover:border-accent";
  }

  if (userId === null) {
    return <main className="p-6">Loading...</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl tracking-tight">Agents</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a key, a model, a look and some skills, then chat with your
          agent.
        </p>
      </div>

      <section className="card flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Create an agent</h2>

        {keys.length === 0 ? (
          <p className="text-sm text-yellow-400">
            You need to save an API key first (under API keys).
          </p>
        ) : (
          <form onSubmit={createAgent} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Agent name (e.g. Research helper)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
            />

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Look</span>
              <AvatarPicker
                style={newStyle}
                color={newColor}
                onChange={(s, c) => {
                  setNewStyle(s);
                  setNewColor(c);
                }}
              />
            </div>

            <select
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              className="input"
            >
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.provider}
                  {k.label ? ` - ${k.label}` : ""} (ending in{" "}
                  {k.key_last4 ?? "????"})
                </option>
              ))}
            </select>

            <div className="flex flex-col gap-2">
              <select
                value={modelChoice}
                onChange={(e) => setModelChoice(e.target.value)}
                disabled={modelsLoading}
                className="input"
              >
                <option value="">
                  {modelsLoading ? "Loading models..." : "Choose a model"}
                </option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value={OTHER}>Other (type or paste a name)...</option>
              </select>

              {modelsError && (
                <p className="text-xs text-yellow-400">
                  {modelsError}. You can still type a model name below.
                </p>
              )}

              {modelChoice === OTHER && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Paste or type a model name"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="input"
                  />

                  {suggestions.length > 0 && !exactMatch && (
                    <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface-2 p-1">
                      <span className="px-2 pt-1 text-xs text-muted">
                        Matches found, tap one:
                      </span>
                      {suggestions.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCustomModel(m)}
                          className="truncate rounded px-2 py-1 text-left text-sm transition hover:bg-line"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}

                  {customModel.trim() && exactMatch && (
                    <p className="text-xs text-green-400">
                      Found in this provider&apos;s model list.
                    </p>
                  )}

                  {customModel.trim() &&
                    !exactMatch &&
                    suggestions.length === 0 &&
                    models.length > 0 && (
                      <p className="text-xs text-yellow-400">
                        Not in the list. It will be used exactly as typed.
                      </p>
                    )}
                </div>
              )}
            </div>

            <textarea
              placeholder="Instructions for the agent"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="input"
            />

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Skills for this agent</span>
              {skills.length === 0 ? (
                <p className="text-sm text-muted">
                  No skills yet. Make some on the Skills page.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleNewSkill(s.id)}
                      className={chipClass(newSkillIds.includes(s.id))}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Create agent"}
            </button>
          </form>
        )}
        {message && <p className="text-sm text-yellow-400">{message}</p>}
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Your agents</h2>
        {agents.length === 0 ? (
          <p className="text-sm text-muted">No agents yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {agents.map((a) => {
              const style = normStyle(a.avatar_style);
              const color = normColor(a.avatar_color);
              return (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-surface-2 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <AgentAvatar style={style} color={color} size={44} />
                      <div className="min-w-0">
                        <p className="font-medium">{a.name}</p>
                        <p className="truncate text-sm text-muted">
                          {a.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        onClick={() =>
                          setEditingLookId(editingLookId === a.id ? null : a.id)
                        }
                        className="text-sm text-muted hover:text-foreground"
                      >
                        Look
                      </button>
                      <button
                        onClick={() => deleteAgent(a.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingLookId === a.id && (
                    <AvatarPicker
                      style={style}
                      color={color}
                      onChange={(s, c) => changeLook(a, s, c)}
                    />
                  )}

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleAgentSkill(a, s.id)}
                          className={chipClass(a.skill_ids.includes(s.id))}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
