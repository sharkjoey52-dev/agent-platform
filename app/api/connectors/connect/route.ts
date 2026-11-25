import { NextResponse } from "next/server";
import { Composio } from "@composio/core";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!process.env.COMPOSIO_API_KEY) {
    return NextResponse.json(
      { error: "COMPOSIO_API_KEY is not set" },
      { status: 500 }
    );
  }

  const toolkit = new URL(request.url).searchParams.get("toolkit");
  if (!toolkit) {
    return NextResponse.json({ error: "Missing toolkit" }, { status: 400 });
  }

  try {
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
    const session = await composio.create(user.id, { toolkits: [toolkit] });
    const connection = await session.authorize(toolkit);

    if (!connection.redirectUrl) {
      return NextResponse.json(
        { error: "Composio did not return a sign-in link" },
        { status: 502 }
      );
    }

    return NextResponse.redirect(connection.redirectUrl);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}
