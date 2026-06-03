import "server-only";
import { eq } from "drizzle-orm";
import { getAiProvider, type AiProviderId } from "@builder/shared";
import { db, userSecrets } from "@builder/db";
import { decryptSecret } from "./crypto";

/**
 * Provider-agnostic LLM layer. Calls the user's chosen provider with their own
 * decrypted key via plain fetch (no SDKs) — Groq/OpenAI share the OpenAI
 * format, Anthropic and Gemini have their own shapes.
 */

export type AiCreds = { provider: AiProviderId; apiKey: string; model?: string };

export type ChatOptions = {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  /** Hint the model to return JSON (and enable provider JSON modes). */
  json?: boolean;
};

/** Load + decrypt the signed-in user's AI credentials, or null if unset. */
export async function getUserAi(userId: string): Promise<AiCreds | null> {
  const [row] = await db
    .select()
    .from(userSecrets)
    .where(eq(userSecrets.userId, userId))
    .limit(1);
  if (!row?.aiKeyEnc || !row.aiProvider) return null;
  return {
    provider: row.aiProvider as AiProviderId,
    apiKey: decryptSecret(row.aiKeyEnc),
  };
}

export class AiError extends Error {}

export async function complete(
  creds: AiCreds,
  opts: ChatOptions
): Promise<string> {
  const provider = getAiProvider(creds.provider);
  if (!provider) throw new AiError(`Unknown AI provider: ${creds.provider}`);
  const model = creds.model ?? provider.defaultModel;
  const maxTokens = opts.maxTokens ?? 2048;
  const temperature = opts.temperature ?? 0.2;

  try {
    if (provider.apiKind === "openai-compat") {
      return await openAiCompat(provider.baseUrl, creds.apiKey, model, opts, maxTokens, temperature);
    }
    if (provider.apiKind === "anthropic") {
      return await anthropic(provider.baseUrl, creds.apiKey, model, opts, maxTokens, temperature);
    }
    return await google(provider.baseUrl, creds.apiKey, model, opts, maxTokens, temperature);
  } catch (err) {
    if (err instanceof AiError) throw err;
    throw new AiError(err instanceof Error ? err.message : "AI request failed");
  }
}

/** Run an LLM call expected to return JSON; parses defensively. */
export async function completeJson<T = unknown>(
  creds: AiCreds,
  opts: ChatOptions
): Promise<T> {
  const raw = await complete(creds, { ...opts, json: true });
  return extractJson<T>(raw);
}

export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new AiError("Model did not return JSON.");
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    throw new AiError("Model returned malformed JSON.");
  }
}

/* -------------------------------------------------------------- providers */

async function openAiCompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  opts: ChatOptions,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const messages = [
    ...(opts.system ? [{ role: "system", content: opts.system }] : []),
    { role: "user", content: opts.prompt },
  ];
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new AiError(await errText(res));
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function anthropic(
  baseUrl: string,
  apiKey: string,
  model: string,
  opts: ChatOptions,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const res = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: "user", content: opts.prompt }],
    }),
  });
  if (!res.ok) throw new AiError(await errText(res));
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function google(
  baseUrl: string,
  apiKey: string,
  model: string,
  opts: ChatOptions,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const res = await fetch(
    `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...(opts.system
          ? { systemInstruction: { parts: [{ text: opts.system }] } }
          : {}),
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );
  if (!res.ok) throw new AiError(await errText(res));
  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ??
    ""
  );
}

async function errText(res: Response): Promise<string> {
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.error?.message ?? JSON.stringify(body).slice(0, 200);
  } catch {
    detail = await res.text().catch(() => "");
  }
  return `AI provider error (${res.status}): ${detail || res.statusText}`;
}
