"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Agent = { id: string; name: string; model: string | null };
type Convo = { id: string; title: string | null };
type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [convos, setConvos] = useState<Convo[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const agent = agents.find((a) => a.id === agentId);

  const loadConvos = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("conversations")
      .select("id, title")
      .eq("agent_id", id)
      .order("created_at", { ascending: false })
      .limit(30);
    setConvos(data ?? []);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      const res = await supabase
        .from("agents")
        .select("id, name, model")
        .order("created_at", { ascending: false });
      if (res.data) {
        setAgents(res.data);
        setAgentId(res.data[0]?.id ?? "");
      }
      setReady(true);
    });
  }, [router]);

  useEffect(() => {
    if (agentId) loadConvos(agentId);
  }, [agentId, loadConvos]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Make the message box grow as you type
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  function newChat() {
    setConversationId(null);
    setMessages([]);
    setError("");
    setSidebarOpen(false);
  }

  function selectAgent(id: string) {
    setAgentId(id);
    setConvos([]);
    newChat();
  }

  async function openConvo(id: string) {
    setError("");
    setSidebarOpen(false);
    setConversationId(id);
    setMessages([]);
    setLoadingConvo(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true });

    setMessages((data ?? []) as ChatMessage[]);
    setLoadingConvo(false);
  }

  async function deleteConvo(id: string) {
    const supabase = createClient();
    const { error: delError } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    if (id === conversationId) newChat();
    loadConvos(agentId);
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !agentId || sending) return;

    const wasNew = !conversationId;
    setInput("");
    setError("");
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, conversationId, message: text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
      } else {
        setConversationId(json.conversationId);
        setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
        if (wasNew) loadConvos(agentId);
      }
    } catch {
      setError("Could not reach the server");
    }
    setSending(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!ready) {
    return (
      <main className="flex h-dvh items-center justify-center bg-[#262624] text-[#9b9a95]">
        Loading...
      </main>
    );
  }

  return (
    <div className="flex h-dvh bg-[#262624] text-[#ececec]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-white/10 bg-[#1f1e1d] transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/menu" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-5 w-5 rounded-md bg-[#d97757]" />
            AgentHub
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-[#9b9a95] hover:text-white md:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={newChat}
            className="flex w-full items-center gap-2 rounded-lg bg-[#d97757]/15 px-3 py-2 text-sm font-medium text-[#e8a085] transition hover:bg-[#d97757]/25"
          >
            <span className="text-lg leading-none">+</span> New chat
          </button>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-3">
          <div>
            <div className="mb-1 flex items-center justify-between px-2">
              <span className="text-xs font-medium uppercase tracking-wide text-[#9b9a95]">
                Agents
              </span>
              <Link
                href="/agents"
                className="text-xs text-[#9b9a95] hover:text-white"
              >
                Manage
              </Link>
            </div>
            {agents.length === 0 ? (
              <p className="px-2 text-sm text-[#9b9a95]">
                No agents yet.{" "}
                <Link href="/agents" className="underline">
                  Create one
                </Link>
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {agents.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => selectAgent(a.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                        a.id === agentId
                          ? "bg-white/10 text-white"
                          : "text-[#c2c0b6] hover:bg-white/5"
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#3a3937] text-xs font-semibold">
                        {a.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="truncate">{a.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {agentId && (
            <div>
              <span className="mb-1 block px-2 text-xs font-medium uppercase tracking-wide text-[#9b9a95]">
                Recents
              </span>
              {convos.length === 0 ? (
                <p className="px-2 text-sm text-[#9b9a95]">No chats yet.</p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {convos.map((c) => (
                    <li key={c.id} className="group relative">
                      <button
                        onClick={() => openConvo(c.id)}
                        className={`w-full truncate rounded-lg px-2 py-2 pr-8 text-left text-sm transition ${
                          c.id === conversationId
                            ? "bg-white/10 text-white"
                            : "text-[#c2c0b6] hover:bg-white/5"
                        }`}
                      >
                        {c.title || "Untitled chat"}
                      </button>
                      <button
                        onClick={() => deleteConvo(c.id)}
                        className="absolute right-2 top-1/2 hidden -translate-y-1/2 text-xs text-[#9b9a95] hover:text-red-400 group-hover:block"
                        aria-label="Delete chat"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-3 py-3">
          <div className="grid grid-cols-2 gap-1 text-sm text-[#c2c0b6]">
            <Link href="/menu" className="rounded-lg px-2 py-1.5 hover:bg-white/5">
              Menu
            </Link>
            <Link href="/skills" className="rounded-lg px-2 py-1.5 hover:bg-white/5">
              Skills
            </Link>
            <Link
              href="/connectors"
              className="rounded-lg px-2 py-1.5 hover:bg-white/5"
            >
              Connectors
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg px-2 py-1.5 hover:bg-white/5"
            >
              Keys
            </Link>
          </div>
          <button
            onClick={signOut}
            className="mt-2 w-full rounded-lg px-2 py-1.5 text-left text-sm text-[#9b9a95] hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 px-4 py-3 md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg px-2 py-1 text-xl text-[#c2c0b6] hover:bg-white/5 md:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>
          {agent && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{agent.name}</p>
              <p className="truncate text-xs text-[#9b9a95]">{agent.model}</p>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6">
            {agents.length === 0 ? (
              <div className="mt-24 text-center">
                <p className="font-serif text-3xl">Create your first agent</p>
                <p className="mt-2 text-sm text-[#9b9a95]">
                  You need an agent before you can chat.
                </p>
                <Link
                  href="/agents"
                  className="mt-5 inline-block rounded-lg bg-[#d97757] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c6694a]"
                >
                  Go to Agents
                </Link>
              </div>
            ) : loadingConvo ? (
              <p className="mt-24 text-center text-sm text-[#9b9a95]">
                Loading chat...
              </p>
            ) : messages.length === 0 ? (
              <div className="mt-24 text-center">
                <p className="text-3xl text-[#d97757]">✦</p>
                <p className="mt-3 font-serif text-3xl sm:text-4xl">
                  How can {agent?.name ?? "I"} help you today?
                </p>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-[#3a3937] px-4 py-2.5 text-[15px]">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-3">
                    <span className="mt-1 text-lg text-[#d97757]">✦</span>
                    <div className="min-w-0 flex-1 whitespace-pre-wrap font-serif text-[16px] leading-7">
                      {m.content}
                    </div>
                  </div>
                )
              )
            )}

            {sending && (
              <div className="flex items-center gap-3">
                <span className="animate-pulse text-lg text-[#d97757]">✦</span>
                <span className="text-sm text-[#9b9a95]">Thinking...</span>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {agents.length > 0 && (
          <div className="px-4 pb-4">
            <form
              onSubmit={send}
              className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-white/10 bg-[#30302e] p-2 shadow-lg focus-within:border-white/25"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder={`Message ${agent?.name ?? "your agent"}`}
                className="max-h-52 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-[#9b9a95]"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d97757] text-lg font-bold text-white transition hover:bg-[#c6694a] disabled:opacity-40"
                aria-label="Send"
              >
                ↑
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-[#9b9a95]">
              Enter to send, Shift+Enter for a new line
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
