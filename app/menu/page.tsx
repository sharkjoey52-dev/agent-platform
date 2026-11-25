import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ITEMS = [
  {
    href: "/chat",
    title: "Chat",
    text: "Talk to one of your agents.",
    icon: "💬",
  },
  {
    href: "/agents",
    title: "Agents",
    text: "Create and manage your agents.",
    icon: "🤖",
  },
  {
    href: "/skills",
    title: "Skills",
    text: "Reusable instructions for your agents.",
    icon: "✨",
  },
  {
    href: "/connectors",
    title: "Connectors",
    text: "Link your apps, like Gmail.",
    icon: "🔌",
  },
  {
    href: "/dashboard",
    title: "API keys",
    text: "Add and remove your saved keys.",
    icon: "🔑",
  },
];

const COMING_SOON = [
  { title: "Tools", text: "Let agents do things.", icon: "🧰" },
];

export default async function MenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Main menu</h1>
        <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card group transition hover:border-accent hover:bg-surface-2"
          >
            <div className="mb-3 text-3xl">{item.icon}</div>
            <h2 className="font-semibold group-hover:text-accent">
              {item.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{item.text}</p>
          </Link>
        ))}

        {COMING_SOON.map((item) => (
          <div key={item.title} className="card opacity-50">
            <div className="mb-3 text-3xl">{item.icon}</div>
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">
              {item.text} Coming soon.
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
