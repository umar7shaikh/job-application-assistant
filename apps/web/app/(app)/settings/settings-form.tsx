"use client";

import { useActionState, useState } from "react";
import { aiProviders, getAiProvider, type AiProviderId } from "@builder/shared";
import { saveSecrets, type SecretsState } from "@/app/actions/secrets";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";

function ConnectedBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-strong">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-faint">
      <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
      Not set
    </span>
  );
}

export function SettingsForm({
  apifyConnected,
  rapidapiConnected,
  aiConnected,
  aiProvider,
}: {
  apifyConnected: boolean;
  rapidapiConnected: boolean;
  aiConnected: boolean;
  aiProvider: AiProviderId | "";
}) {
  const [state, action] = useActionState<SecretsState, FormData>(
    saveSecrets,
    undefined
  );
  const [provider, setProvider] = useState<AiProviderId | "">(aiProvider);
  const selected = getAiProvider(provider);

  return (
    <form
      action={action}
      className="space-y-px overflow-hidden rounded-xl border border-line bg-line"
    >
      {/* Apify */}
      <section className="bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl tracking-tight text-ink">Apify</h2>
          <ConnectedBadge connected={apifyConnected} />
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">
          Used to scrape job listings and descriptions. Find your token in the
          Apify console under Settings → Integrations.{" "}
          <a
            href="https://console.apify.com/settings/integrations"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Get a token →
          </a>
        </p>
        <div className="mt-4">
          <TextField
            label="Apify API token"
            name="apifyKey"
            type="password"
            autoComplete="off"
            placeholder={
              apifyConnected ? "•••• saved — leave blank to keep" : "apify_api_…"
            }
          />
        </div>
      </section>

      {/* JSearch (RapidAPI) */}
      <section className="bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl tracking-tight text-ink">
            JSearch job API
          </h2>
          <ConnectedBadge connected={rapidapiConnected} />
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">
          A free, zero-maintenance source for job listings + descriptions.
          Subscribe to JSearch on RapidAPI and paste your key.{" "}
          <a
            href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Get a key →
          </a>
        </p>
        <div className="mt-4">
          <TextField
            label="RapidAPI key"
            name="rapidApiKey"
            type="password"
            autoComplete="off"
            placeholder={
              rapidapiConnected ? "•••• saved — leave blank to keep" : "Your RapidAPI key"
            }
          />
        </div>
      </section>

      {/* AI */}
      <section className="bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl tracking-tight text-ink">
            AI provider
          </h2>
          <ConnectedBadge connected={aiConnected} />
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">
          Used to analyze descriptions and tailor your resume. Bring your own
          key — providers marked{" "}
          <span className="font-medium text-accent">Free</span> have a no-cost
          tier.
        </p>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Provider
            </span>
            <select
              name="aiProvider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProviderId | "")}
              className="w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="">Select a provider…</option>
              {aiProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {p.free ? " · Free" : ""}
                </option>
              ))}
            </select>
          </label>

          {selected ? (
            <div className="flex items-center justify-between rounded-md bg-canvas px-3 py-2.5 text-xs">
              <span className="text-ink-soft">
                {selected.free ? (
                  <span className="mr-1.5 rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent-strong">
                    Free
                  </span>
                ) : null}
                {selected.note}
              </span>
              <a
                href={selected.consoleUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent hover:underline"
              >
                Get a key →
              </a>
            </div>
          ) : null}

          <TextField
            label="AI API key"
            name="aiKey"
            type="password"
            autoComplete="off"
            placeholder={
              aiConnected
                ? "•••• saved — leave blank to keep"
                : selected?.placeholder ?? "Your API key"
            }
          />
        </div>
      </section>

      {/* Actions */}
      <section className="flex items-center justify-between bg-surface p-6">
        <div className="text-sm" aria-live="polite">
          {state?.ok ? (
            <span className="text-accent">Saved.</span>
          ) : state?.error ? (
            <span className="text-danger">{state.error}</span>
          ) : (
            <span className="text-ink-faint">
              Keys are encrypted with AES-256 before storage.
            </span>
          )}
        </div>
        <SubmitButton pendingLabel="Saving…">Save keys</SubmitButton>
      </section>
    </form>
  );
}
