/**
 * Supported AI providers (bring-your-own-key). Single source of truth used by
 * validation, the settings UI, and the LLM call layer.
 * `free: true` providers have a usable no-cost tier — surfaced in the UI.
 *
 * `apiKind` tells the call layer which request shape to use:
 *   - "openai-compat": OpenAI Chat Completions format (OpenAI, Groq)
 *   - "anthropic":     Anthropic Messages API
 *   - "google":        Gemini generateContent
 */
export const aiProviders = [
  {
    id: "groq",
    label: "Groq",
    free: true,
    placeholder: "gsk_…",
    consoleUrl: "https://console.groq.com/keys",
    note: "Free tier — fast Llama / Mixtral models",
    apiKind: "openai-compat",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  },
  {
    id: "google",
    label: "Google Gemini",
    free: true,
    placeholder: "AIza…",
    consoleUrl: "https://aistudio.google.com/apikey",
    note: "Free tier via Google AI Studio",
    apiKind: "google",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-1.5-flash",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    free: false,
    placeholder: "sk-ant-…",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    note: "Paid — highest quality",
    apiKind: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-haiku-latest",
  },
  {
    id: "openai",
    label: "OpenAI",
    free: false,
    placeholder: "sk-…",
    consoleUrl: "https://platform.openai.com/api-keys",
    note: "Paid",
    apiKind: "openai-compat",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
] as const;

export type AiProvider = (typeof aiProviders)[number];
export type AiProviderId = AiProvider["id"];

export const aiProviderIds = aiProviders.map((p) => p.id) as [
  AiProviderId,
  ...AiProviderId[]
];

export function getAiProvider(id: string | null | undefined): AiProvider | undefined {
  return aiProviders.find((p) => p.id === id);
}
