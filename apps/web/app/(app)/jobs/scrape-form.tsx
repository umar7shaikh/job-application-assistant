"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { runScrape, type ScrapeState } from "@/app/actions/jobs";
// Import from the pure module (NOT the barrel) so this client component
// never pulls in server-only code (crypto/db/env).
import { experienceOptions, datePostedOptions } from "@/lib/sources/types";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";

const inputCls = "c-field";

function parseList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function dedupeCI(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = raw.trim();
    if (!v) continue;
    const low = v.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    out.push(v);
  }
  return out;
}

export function ScrapeForm({
  apifyConnected,
  rapidapiConnected,
  keywordSuggestions,
  resumeLocation,
}: {
  apifyConnected: boolean;
  rapidapiConnected: boolean;
  keywordSuggestions: string[];
  resumeLocation: string;
}) {
  const [state, action] = useActionState<ScrapeState, FormData>(
    runScrape,
    undefined
  );
  const [source, setSource] = useState<"apify" | "jsearch">(
    rapidapiConnected && !apifyConnected ? "jsearch" : "apify"
  );
  // Controlled so résumé chips can toggle keywords in/out of the field.
  const [keywords, setKeywords] = useState("");
  const selected = new Set(parseList(keywords).map((k) => k.toLowerCase()));
  const toggleKeyword = (k: string) => {
    const low = k.toLowerCase();
    const list = parseList(keywords);
    setKeywords(
      (selected.has(low)
        ? list.filter((x) => x.toLowerCase() !== low)
        : [...list, k]
      ).join(", ")
    );
  };

  // Location is a single value — chips set/clear it.
  const [location, setLocation] = useState("");
  const locationChips = dedupeCI([resumeLocation, "Remote"]);
  const setLoc = (c: string) =>
    setLocation(location.trim().toLowerCase() === c.toLowerCase() ? "" : c);
  // Friendly preset → Apify actor id. "custom" reveals a free-text field.
  const [actor, setActor] = useState<string>(
    "curious_coder/linkedin-jobs-scraper"
  );

  // Search settings we remember across visits (persisted to localStorage).
  const [experience, setExperience] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [maxItems, setMaxItems] = useState("25");

  // Restore the last-used settings on mount (SSR-safe: effect only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("lever.scrapeSettings");
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        source?: "apify" | "jsearch";
        actor?: string;
        experience?: string;
        datePosted?: string;
        maxItems?: string;
      };
      if (saved.source === "apify" || saved.source === "jsearch") {
        setSource(saved.source);
      }
      if (typeof saved.actor === "string") setActor(saved.actor);
      if (typeof saved.experience === "string") setExperience(saved.experience);
      if (typeof saved.datePosted === "string") setDatePosted(saved.datePosted);
      if (typeof saved.maxItems === "string") setMaxItems(saved.maxItems);
    } catch {
      // Ignore malformed/unavailable storage — just use defaults.
    }
  }, []);

  // Save whenever any remembered setting changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "lever.scrapeSettings",
        JSON.stringify({ source, actor, experience, datePosted, maxItems })
      );
    } catch {
      // Ignore storage write failures (e.g. private mode / quota).
    }
  }, [source, actor, experience, datePosted, maxItems]);

  const connected = source === "apify" ? apifyConnected : rapidapiConnected;

  return (
    <form action={action} className="c-card p-6">
      <div className="grid gap-4">
        <label className="block">
          <span className="c-label">Source</span>
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
        <label className="block">
          <span className="c-label">Max results</span>
          <input
            name="maxItems"
            type="number"
            value={maxItems}
            onChange={(e) => setMaxItems(e.target.value)}
            className="c-field"
          />
        </label>
      </div>

      {!connected ? (
        <p className="mt-4 rounded-lg border-2 border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink-soft">
          {source === "apify"
            ? "Connect your Apify token "
            : "Connect your RapidAPI (JSearch) key "}
          <Link href="/settings" className="font-medium text-accent hover:underline">
            in Settings →
          </Link>
        </p>
      ) : null}

      <div className="mt-4 grid gap-4">
        <div>
          <label className="block">
            <span className="c-label">Keywords</span>
            <input
              name="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Frontend engineer, React"
              className="c-field"
            />
          </label>
          {keywordSuggestions.length > 0 ? (
            <div className="mt-2">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink/45">
                  From your résumé — tap to add
                </p>
                {keywords ? (
                  <button
                    type="button"
                    onClick={() => setKeywords("")}
                    className="text-[11px] font-extrabold uppercase tracking-wide text-pop-red hover:underline"
                  >
                    ✕ Clear
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywordSuggestions.map((k) => {
                  const on = selected.has(k.toLowerCase());
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleKeyword(k)}
                      className={`rounded-full border-2 border-ink px-2.5 py-1 text-xs font-bold transition-transform hover:-translate-y-0.5 ${
                        on ? "bg-pop-green text-white" : "bg-white text-ink/70"
                      }`}
                    >
                      {on ? "✓ " : "+ "}
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
        <div>
          <label className="block">
            <span className="c-label">Location</span>
            <input
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote, Bangalore…"
              className="c-field"
            />
          </label>
          {locationChips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {locationChips.map((c) => {
                const on = location.trim().toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLoc(c)}
                    className={`rounded-full border-2 border-ink px-2.5 py-1 text-xs font-bold transition-transform hover:-translate-y-0.5 ${
                      on ? "bg-pop-green text-white" : "bg-white text-ink/70"
                    }`}
                  >
                    {on ? "✓ " : "+ "}
                    {c}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <label className="block">
          <span className="c-label">
            Experience level
          </span>
          <select
            name="experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className={inputCls}
          >
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
            <span className="c-label">
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
                <span className="c-label">
                  Date posted
                </span>
                <select
                  name="datePosted"
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className={inputCls}
                >
                  {datePostedOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="c-label">
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
          ) : state?.message ? (
            <span className="font-semibold text-accent">{state.message}</span>
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
