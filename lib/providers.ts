// Each provider has a base web address and a request format.
// "openai" is the common chat format. "anthropic" is Claude's own format.
type Format = "openai" | "anthropic";

const PROVIDERS: Record<string, { base: string; format: Format }> = {
  "NVIDIA NIM": { base: "https://integrate.api.nvidia.com/v1", format: "openai" },
  Anthropic: { base: "https://api.anthropic.com/v1", format: "anthropic" },
  Groq: { base: "https://api.groq.com/openai/v1", format: "openai" },
  OpenAI: { base: "https://api.openai.com/v1", format: "openai" },
  OpenRouter: { base: "https://openrouter.ai/api/v1", format: "openai" },
  "Google Gemini": {
    base: "https://generativelanguage.googleapis.com/v1beta/openai",
    format: "openai",
  },
  Mistral: { base: "https://api.mistral.ai/v1", format: "openai" },
  "Together AI": { base: "https://api.together.xyz/v1", format: "openai" },
  DeepSeek: { base: "https://api.deepseek.com/v1", format: "openai" },
  xAI: { base: "https://api.x.ai/v1", format: "openai" },
  Cerebras: { base: "https://api.cerebras.ai/v1", format: "openai" },
  Fireworks: { base: "https://api.fireworks.ai/inference/v1", format: "openai" },
};

export const PROVIDER_NAMES = Object.keys(PROVIDERS);

export function providerFormat(provider: string): Format | null {
  return PROVIDERS[provider]?.format ?? null;
}

export function chatUrl(provider: string): string | null {
  const p = PROVIDERS[provider];
  if (!p) return null;
  return p.format === "anthropic"
    ? `${p.base}/messages`
    : `${p.base}/chat/completions`;
}

export function modelsUrl(provider: string): string | null {
  const p = PROVIDERS[provider];
  if (!p) return null;
  // Anthropic only returns 20 models unless you ask for more
  return p.format === "anthropic" ? `${p.base}/models?limit=1000` : `${p.base}/models`;
}

export function authHeaders(provider: string, apiKey: string): Record<string, string> {
  if (PROVIDERS[provider]?.format === "anthropic") {
    return {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
  }
  return { Authorization: `Bearer ${apiKey}` };
}
