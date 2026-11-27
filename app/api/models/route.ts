import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { authHeaders, modelsUrl } from "@/lib/providers";

// Models that can't chat, so we hide them from the list
const SKIP = [
  "embed",
  "rerank",
  "whisper",
  "tts",
  "guard",
  "moderation",
  "safety",
  "transcribe",
  "dall-e",
  "clip",
];

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const keyId = new URL(request.url).searchParams.get("keyId");
  if (!keyId) {
    return NextResponse.json({ error: "Missing keyId" }, { status: 400 });
  }

  // Find which provider this key belongs to (Row Level Security applies)
  const { data: keyRow, error: keyRowError } = await supabase
    .from("api_keys")
    .select("provider")
    .eq("id", keyId)
    .single();

  if (keyRowError || !keyRow) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  const url = modelsUrl(keyRow.provider);
  if (!url) {
    return NextResponse.json(
      { error: `${keyRow.provider} is not supported yet` },
      { status: 400 }
    );
  }

  const { data: encrypted, error: secretError } = await supabase.rpc(
    "get_api_key_secret",
    { key_id: keyId }
  );
  if (secretError || !encrypted) {
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

  try {
    const res = await fetch(url, {
      headers: authHeaders(keyRow.provider, apiKey),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const detail =
        json?.error?.message ?? json?.detail ?? json?.message ?? res.statusText;
      return NextResponse.json(
        { error: `Provider error (${res.status}): ${detail}` },
        { status: 502 }
      );
    }

    const ids: string[] = (json?.data ?? [])
      .map((m: { id?: string }) => m.id)
      .filter((id: unknown): id is string => typeof id === "string")
      .filter((id: string) => !SKIP.some((s) => id.toLowerCase().includes(s)));

    ids.sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ provider: keyRow.provider, models: ids });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the model provider" },
      { status: 502 }
    );
  }
}
