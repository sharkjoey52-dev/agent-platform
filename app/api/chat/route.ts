import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { chatUrl } from "@/lib/providers";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { agentId?: string; conversationId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!body.agentId || !message) {
    return NextResponse.json(
      { error: "Agent and message are required" },
      { status: 400 }
    );
  }

  // 1. Load the agent (Row Level Security limits this to your own agents)
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, system_prompt, provider, model, api_key_id, skill_ids")
    .eq("id", body.agentId)
    .single();

  if (agentError || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  if (!agent.api_key_id || !agent.provider || !agent.model) {
    return NextResponse.json(
      { error: "This agent has no API key or model set" },
      { status: 400 }
    );
  }

  const endpoint = chatUrl(agent.provider);
  if (!endpoint) {
    return NextResponse.json(
      { error: `${agent.provider} is not supported yet` },
      { status: 400 }
    );
  }

  // 2. Build the instructions: the agent's own prompt plus its skills
  let systemPrompt: string = agent.system_prompt;
  const skillIds: string[] = agent.skill_ids ?? [];
  if (skillIds.length > 0) {
    const { data: skills } = await supabase
      .from("skills")
      .select("name, instructions")
      .in("id", skillIds);
    if (skills && skills.length > 0) {
      const skillText = skills
        .map((s) => `Skill - ${s.name}:\n${s.instructions}`)
        .join("\n\n");
      systemPrompt = `${systemPrompt}\n\nYou also have these skills. Follow them:\n\n${skillText}`;
    }
  }

  // 3. Fetch and decrypt the key (server only)
  const { data: encrypted, error: keyError } = await supabase.rpc(
    "get_api_key_secret",
    { key_id: agent.api_key_id }
  );
  if (keyError || !encrypted) {
    return NextResponse.json(
      { error: "Could not load the saved API key" },
      { status: 500 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(encrypted);
  } catch {
    return NextResponse.json(
      { error: "Could not decrypt the saved API key" },
      { status: 500 }
    );
  }

  // 4. Find or create the conversation
  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data: convo, error: convoError } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        agent_id: agent.id,
        title: message.slice(0, 50),
      })
      .select("id")
      .single();
    if (convoError || !convo) {
      return NextResponse.json(
        { error: convoError?.message ?? "Could not create conversation" },
        { status: 500 }
      );
    }
    conversationId = convo.id;
  }

  // 5. Save the user's message
  const { error: userMsgError } = await supabase.from("messages").insert({
    user_id: user.id,
    conversation_id: conversationId,
    role: "user",
    content: message,
  });
  if (userMsgError) {
    return NextResponse.json({ error: userMsgError.message }, { status: 500 });
  }

  // 6. Load recent history
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(30);

  // 7. Call the model
  let reply: string;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: agent.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...(history ?? []),
        ],
        max_tokens: 1024,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const detail =
        json?.error?.message ?? json?.detail ?? json?.message ?? res.statusText;
      return NextResponse.json(
        { error: `Model error (${res.status}): ${detail}` },
        { status: 502 }
      );
    }

    reply = json?.choices?.[0]?.message?.content ?? "";
    if (!reply) {
      return NextResponse.json(
        { error: "The model returned an empty reply" },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not reach the model provider" },
      { status: 502 }
    );
  }

  // 8. Save the reply
  await supabase.from("messages").insert({
    user_id: user.id,
    conversation_id: conversationId,
    role: "assistant",
    content: reply,
  });

  return NextResponse.json({ conversationId, reply });
}
