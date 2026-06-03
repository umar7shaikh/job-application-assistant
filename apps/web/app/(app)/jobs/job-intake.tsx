"use client";

import { useState } from "react";
import { ScrapeForm } from "./scrape-form";
import { PasteJobForm } from "./paste-job-form";

/** Two ways to add jobs: scrape from a source, or just paste a JD (no keys). */
export function JobIntake({
  apifyConnected,
  rapidapiConnected,
}: {
  apifyConnected: boolean;
  rapidapiConnected: boolean;
}) {
  const [tab, setTab] = useState<"search" | "paste">("search");

  const tabCls = (active: boolean) =>
    `px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-b-2 border-accent text-ink"
        : "border-b-2 border-transparent text-ink-soft hover:text-ink"
    }`;

  return (
    <div>
      <div className="mb-4 flex gap-4 border-b border-line">
        <button
          type="button"
          onClick={() => setTab("search")}
          className={tabCls(tab === "search")}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setTab("paste")}
          className={tabCls(tab === "paste")}
        >
          Paste a JD
        </button>
      </div>

      {tab === "search" ? (
        <ScrapeForm
          apifyConnected={apifyConnected}
          rapidapiConnected={rapidapiConnected}
        />
      ) : (
        <PasteJobForm />
      )}
    </div>
  );
}
