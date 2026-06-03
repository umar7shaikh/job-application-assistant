"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { runScrape, type ScrapeState } from "@/app/actions/jobs";
// Import from the pure module (NOT the barrel) so this client component
// never pulls in server-only code (crypto/db/env).
import { experienceOptions, datePostedOptions } from "@/lib/sources/types";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";

const inputCls =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";

export function ScrapeForm({
  apifyConnected,
  rapidapiConnected,
}: {
  apifyConnected: boolean;
  rapidapiConnected: boolean;
}) {
  const [state, action] = useActionState<ScrapeState, FormData>(
    runScrape,
    undefined
  );
  const [source, setSource] = useState<"apify" | "jsearch">(
    rapidapiConnected && !apifyConnected ? "jsearch" : "apify"
  );
  // Friendly preset → Apify actor id. "custom" reveals a free-text field.
  const [actor, setActor] = useState<string>(
    "curious_coder/linkedin-jobs-scraper"
  );

  const connected = source === "apify" ? apifyConnected : rapidapiConnected;

  return (
    <form action={action} className="rounded-xl border border-line bg-surface p-6">
      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Source</span>
          <select
            name="source"
            value={source}
            onChange={(e) => setSource(e.target.value as "apify" | "jsearch")}
            className={inputCls}
          >
            <option value="apify">Apify (run an actor)</option>
            <option value="jsearch">JSearch (job API · free)</option>
          </select>
        </label>
        <TextField label="Max results" name="maxItems" type="number" defaultValue="25" />
      </div>

      {!connected ? (
        <p className="mt-4 rounded-md border border-line-strong bg-canvas px-3 py-2.5 text-sm text-ink-soft">
          {source === "apify"
            ? "Connect your Apify token "
            : "Connect your RapidAPI (JSearch) key "}
          <Link href="/settings" className="font-medium text-accent hover:underline">
            in Settings →
          </Link>
        </p>
      ) : null}

      <div className="mt-4 grid gap-4">
        <TextField
          label="Keywords"
          name="keywords"
          placeholder="Frontend engineer, React"
        />
        <TextField label="Location" name="location" placeholder="Remote, Bangalore…" />
      </div>

      <div className="mt-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Experience level
          </span>
          <select name="experience" defaultValue="" className={inputCls}>
            {experienceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {source === "apify" ? (
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Job site
            </span>
            <select
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className={inputCls}
            >
              <option value="curious_coder/linkedin-jobs-scraper">
                LinkedIn
              </option>
              <option value="misceres/indeed-scraper">Indeed</option>
              <option value="bebity/glassdoor-jobs-scraper">Glassdoor</option>
              <option value="memo23/naukri-scraper">Naukri (India)</option>
              <option value="custom">Custom actor…</option>
            </select>
            <span className="mt-1 block text-xs text-ink-faint">
              Just fill keywords / location / experience above — no JSON needed.
              Each site runs its matching Apify actor.
            </span>
          </label>

          {actor === "curious_coder/linkedin-jobs-scraper" ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Date posted
                </span>
                <select name="datePosted" defaultValue="" className={inputCls}>
                  {datePostedOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Or paste LinkedIn search URL(s)
                </span>
                <textarea
                  name="searchUrls"
                  rows={4}
                  placeholder={
                    "https://www.linkedin.com/jobs/search/?keywords=...\none URL per line"
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
                <span className="mt-1 block text-xs text-ink-faint">
                  One per line. If filled, these run exactly as-is and the
                  keywords / location / experience / date above are ignored.
                </span>
              </label>
            </>
          ) : null}

          {actor === "custom" ? (
            <TextField
              label="Apify actor ID"
              name="actorId"
              placeholder="e.g. username/some-jobs-scraper"
              hint="Paste any Apify actor ID. Use Advanced JSON below to match its input schema."
            />
          ) : (
            <input type="hidden" name="actorId" value={actor} />
          )}

          <details>
            <summary className="cursor-pointer text-sm font-medium text-ink-soft hover:text-ink">
              Advanced: raw input JSON (other actors)
            </summary>
            <div className="mt-3">
              <textarea
                name="rawInput"
                rows={4}
                placeholder='{ "position": "react developer", "location": "remote", "maxItems": 25 }'
                className={`${inputCls} font-mono text-xs`}
              />
              <span className="mt-1 block text-xs text-ink-faint">
                Only needed for unknown actors. If set, this replaces the
                auto-built input — match your actor&rsquo;s schema.
              </span>
            </div>
          </details>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm" aria-live="polite">
          {state?.ok ? (
            <span className="text-accent">
              Found {state.found}, added {state.inserted} new.
            </span>
          ) : state?.error ? (
            <span className="text-danger">{state.error}</span>
          ) : (
            <span className="text-ink-faint">
              This usually takes a few seconds.
            </span>
          )}
        </span>
        <SubmitButton pendingLabel="Searching…">Search jobs</SubmitButton>
      </div>
    </form>
  );
}
