"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Agent = { id: string; name: string; model: string | null };
type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function changeAgent(id: string) {
    setAgentId(id);
    setConversationId(null);
    setMessages([]);
    setError("");
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !agentId || sending) return;

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
      }
    } catch {
      setError("Could not reach the server");
    }
    setSending(false);
  }

  if (!ready) {
    return <main className="p-6">Loading...</main>;
  }

  return (
    <main className="min-h-screen p-6 flex flex-col gap-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
        <Link href="/dashboard" className="text-sm text-gray-400 underline">
          Back to dashboard
        </Link>
      </div>

      {agents.length === 0 ? (
        <p className="text-yellow-400">
          You have no agents yet. Create one on the{" "}
          <Link href="/agents" className="underline">
            Agents page
          </Link>
          .
        </p>
      ) : (
        <>
          <select
            value={agentId}
            onChange={(e) => changeAgent(e.target.value)}
            className="border border-gray-600 rounded px-3 py-2 bg-black"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.model})
              </option>
            ))}
          </select>

          <div className="flex flex-col gap-3 border border-gray-700 rounded-lg p-4 min-h-64">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400">
                Say something to start the conversation.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "self-end bg-blue-600 rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap"
                    : "self-start bg-gray-800 rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap"
                }
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="self-start text-sm text-gray-400">Thinking...</div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <form onSubmit={send} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
              className="flex-1 border border-gray-600 rounded px-3 py-2 bg-transparent"
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-500 rounded px-4 py-2 font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </>
      )}
    </main>
  );
}
