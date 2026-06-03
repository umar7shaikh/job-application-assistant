import type { JobPosting } from "@builder/shared";
import {
  normalizeJob,
  SourceError,
  type JobSource,
  type ScrapeParams,
  type SourceCreds,
} from "./types";

/**
 * JSearch (RapidAPI) adapter. Aggregates Google-for-Jobs results with full
 * descriptions and a generous free tier — the easiest zero-maintenance source.
 * Needs a RapidAPI key subscribed to the JSearch API.
 */
export const jsearchSource: JobSource = {
  id: "jsearch",
  label: "JSearch (job API)",
  requires: "rapidApiKey",

  async scrape(creds: SourceCreds, params: ScrapeParams): Promise<JobPosting[]> {
    if (!creds.rapidApiKey) throw new SourceError("Missing RapidAPI key.");

    const query = [params.keywords, params.location].filter(Boolean).join(" in ");
    // JSearch returns ~10 results/page; map maxItems to a page count (cap 5).
    const numPages = Math.min(5, Math.max(1, Math.ceil(params.maxItems / 10)));

    const url = new URL("https://jsearch.p.rapidapi.com/search");
    url.searchParams.set("query", query || "software engineer");
    url.searchParams.set("page", "1");
    url.searchParams.set("num_pages", String(numPages));
    if (params.experience) {
      url.searchParams.set("job_requirements", params.experience);
    }

    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": creds.rapidApiKey,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      },
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new SourceError(
        `JSearch request failed (${res.status}). ${detail.slice(0, 200)}`
      );
    }

    const body = (await res.json()) as { data?: unknown };
    const data = Array.isArray(body.data) ? body.data : [];
    return data
      .slice(0, params.maxItems)
      .map((it) => normalizeJob(it as Record<string, unknown>, "jsearch"))
      .filter((j): j is JobPosting => j !== null);
  },
};
