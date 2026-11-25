import Link from "next/link";

const FEATURES = [
  {
    title: "Bring your own keys",
    text: "Add your API keys once. They are encrypted before they are saved and only used on the server.",
  },
  {
    title: "Build your agents",
    text: "Name an agent, pick a model, and write its instructions. Make as many as you like.",
  },
  {
    title: "Chat with them",
    text: "Talk to any of your agents and keep every conversation saved to your account.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-12 px-4 py-20">
      <div className="flex flex-col items-start gap-6">
        <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          Your keys. Your agents.
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Build AI agents with
          <span className="text-accent"> your own keys</span>
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Sign up, add the API keys you already have, and chat with agents you
          design. Your keys stay encrypted and are never shown back to the
          browser.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="btn-primary">
            Get started
          </Link>
          <Link href="/menu" className="btn-ghost">
            Open menu
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <h2 className="mb-2 font-semibold">{f.title}</h2>
            <p className="text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
