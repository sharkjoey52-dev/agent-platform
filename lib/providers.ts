// Providers that use the OpenAI-style chat format.
// The value is the base web address for each provider.
export const PROVIDERS: Record<string, string> = {
  "NVIDIA NIM": "https://integrate.api.nvidia.com/v1",
  Groq: "https://api.groq.com/openai/v1",
  OpenAI: "https://api.openai.com/v1",
  OpenRouter: "https://openrouter.ai/api/v1",
  "Google Gemini": "https://generativelanguage.googleapis.com/v1beta/openai",
  Mistral: "https://api.mistral.ai/v1",
  "Together AI": "https://api.together.xyz/v1",
  DeepSeek: "https://api.deepseek.com/v1",
  xAI: "https://api.x.ai/v1",
  Cerebras: "https://api.cerebras.ai/v1",
  Fireworks: "https://api.fireworks.ai/inference/v1",
};

export const PROVIDER_NAMES = Object.keys(PROVIDERS);

export function chatUrl(provider: string): string | null {
  const base = PROVIDERS[provider];
  return base ? `${base}/chat/completions` : null;
}

export function modelsUrl(provider: string): string | null {
  const base = PROVIDERS[provider];
  return base ? `${base}/models` : null;
}
