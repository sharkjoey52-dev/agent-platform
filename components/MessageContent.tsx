"use client";

import { useState } from "react";

type Part = { type: "text" | "code"; content: string; lang?: string };

function parse(content: string): Part[] {
  const parts: Part[] = [];
  const re = /```([^\n`]*)\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(content)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", content: content.slice(last, m.index) });
    }
    parts.push({
      type: "code",
      lang: m[1].trim(),
      content: m[2].replace(/\n$/, ""),
    });
    last = m.index + m[0].length;
  }

  if (last < content.length) {
    parts.push({ type: "text", content: content.slice(last) });
  }
  return parts;
}

// Works on secure pages and on plain http pages (like the Chromebook address)
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the older method
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const ok = await copyText(code);
    setState(ok ? "copied" : "failed");
    setTimeout(() => setState("idle"), 1800);
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#1b1a19]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#2a2927] px-3 py-1.5 text-xs text-[#9b9a95]">
        <span>{lang || "code"}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded px-2 py-0.5 transition hover:bg-white/10 hover:text-white"
        >
          {state === "copied"
            ? "Copied!"
            : state === "failed"
            ? "Select and copy"
            : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[13px] leading-6">
        <code className="font-mono text-[#e6e4dc]">{code}</code>
      </pre>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  // Turn `like this` into small inline code
  const pieces = text.split(/(`[^`\n]+`)/g);
  return (
    <div className="whitespace-pre-wrap">
      {pieces.map((piece, i) =>
        piece.length > 2 && piece.startsWith("`") && piece.endsWith("`") ? (
          <code
            key={i}
            className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em]"
          >
            {piece.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{piece}</span>
        )
      )}
    </div>
  );
}

export default function MessageContent({ content }: { content: string }) {
  const parts = parse(content);

  return (
    <div>
      {parts.map((part, i) =>
        part.type === "code" ? (
          <CodeBlock key={i} code={part.content} lang={part.lang} />
        ) : part.content.trim() ? (
          <TextBlock key={i} text={part.content.trim()} />
        ) : null
      )}
    </div>
  );
}
