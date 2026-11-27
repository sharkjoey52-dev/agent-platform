import { NextResponse } from "next/server";
import { Composio } from "@composio/core";
import { createClient } from "@/lib/supabase/server";
import { CATALOG, authConfigsFor } from "@/lib/composio";

export async function GET() {
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

  try {
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
    const session = await composio.create(user.id, {
      toolkits: CATALOG,
      authConfigs: authConfigsFor(CATALOG),
    });
    const result = await session.toolkits({ limit: 50 });

    const toolkits = result.items
      .filter((t) => !t.isNoAuth)
      .map((t) => ({
        slug: t.slug,
        name: t.name,
        logo: t.logo ?? null,
        connected: t.connection?.isActive === true,
      }));

    return NextResponse.json({ toolkits });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}
