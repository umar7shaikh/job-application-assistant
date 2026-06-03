import type { JobPosting } from "@builder/shared";
import {
  normalizeJob,
  SourceError,
  type JobSource,
  type ScrapeParams,
  type SourceCreds,
} from "./types";

/**
 * Apify adapter. Runs an actor synchronously and returns its dataset items.
 * Note: synchronous runs are simplest for local/dev; for production on Vercel
 * (function time limits) this should move to async run + webhook (Phase 7).
 *
 * Actor inputs are actor-specific, so we send common field aliases by default
 * and let power users override with raw JSON to match their actor's schema.
 */
// Best-effort label mapping for actors that take a named experience level.
const APIFY_EXPERIENCE: Record<string, string> = {
  no_experience: "entry",
  under_3_years_experience: "associate",
  more_than_3_years_experience: "mid-senior",
};

// LinkedIn experience filter codes (f_E): 1 intern, 2 entry, 3 associate,
// 4 mid-senior, 5 director.
const LINKEDIN_FE: Record<string, string> = {
  no_experience: "1,2",
  under_3_years_experience: "2,3",
  more_than_3_years_experience: "4,5",
};

function linkedinSearchUrl(p: ScrapeParams): string {
  const u = new URL("https://www.linkedin.com/jobs/search/");
  if (p.keywords) u.searchParams.set("keywords", p.keywords);
  if (p.location) u.searchParams.set("location", p.location);
  const fe = p.experience ? LINKEDIN_FE[p.experience] : "";
  if (fe) u.searchParams.set("f_E", fe);
  if (p.datePosted) u.searchParams.set("f_TPR", p.datePosted);
  return u.toString();
}

// Naukri's experienceLevel is minimum years (integer).
const NAUKRI_EXPERIENCE: Record<string, number> = {
  no_experience: 0,
  under_3_years_experience: 1,
  more_than_3_years_experience: 4,
};

/**
 * Presets for popular actors so users DON'T have to hand-write input JSON.
 * Keyed by API actor id (tilde form). Builds the actor's input from the
 * friendly keywords/location/experience/maxItems fields. Field names verified
 * against each actor's published input schema.
 */
const KNOWN_ACTORS: Record<string, (p: ScrapeParams) => Record<string, unknown>> = {
  // LinkedIn — curious_coder/linkedin-jobs-scraper. Use pasted search URLs as-is
  // when given; otherwise build one from keywords/location/experience/date.
  "curious_coder~linkedin-jobs-scraper": (p) => ({
    urls: p.searchUrls?.length ? p.searchUrls : [linkedinSearchUrl(p)],
    count: p.maxItems,
    scrapeCompany: true,
  }),
  // Indeed — misceres/indeed-scraper (country defaults to US; override via
  // Advanced JSON for other Indeed domains, e.g. "IN").
  "misceres~indeed-scraper": (p) => ({
    position: p.keywords,
    location: p.location,
    country: "US",
    maxItemsPerSearch: p.maxItems,
  }),
  // Glassdoor — bebity/glassdoor-jobs-scraper
  "bebity~glassdoor-jobs-scraper": (p) => ({
    keyword: p.keywords,
    location: p.location,
    maxItems: p.maxItems,
  }),
  // Naukri (India) — memo23/naukri-scraper
  "memo23~naukri-scraper": (p) => ({
    searchQuery: p.keywords,
    location: p.location,
    maximumJobs: p.maxItems,
    ...(p.experience && p.experience in NAUKRI_EXPERIENCE
      ? { experienceLevel: NAUKRI_EXPERIENCE[p.experience] }
      : {}),
  }),
};

/* Helpers for reading loosely-typed actor output. */
function asObj(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/**
 * Some actors return nested / non-standard fields the generic normalizer can't
 * read. These mappers flatten an actor's item into the common alias shape
 * BEFORE normalizeJob runs. Keyed by tilde actor id.
 */
const ITEM_MAPPERS: Record<
  string,
  (raw: Record<string, unknown>) => Record<string, unknown>
> = {
  // Naukri (memo23) — web link is `staticUrl` (NOT `url`, which is an internal
  // nma.mobi API endpoint); company/location are nested.
  "memo23~naukri-scraper": (raw) => {
    const companyDetail = asObj(raw.companyDetail);
    const companyGulf = asObj(raw.Company);
    const comp = asObj(raw.Compensation);
    const locations = Array.isArray(raw.locations)
      ? raw.locations
          .map((l) => asObj(l)?.label)
          .filter(Boolean)
          .join(", ")
      : undefined;
    return {
      ...raw,
      url: raw.staticUrl ?? raw.JdURL ?? raw.jdURL ?? raw.url,
      title: raw.title ?? raw.Designation,
      company: companyDetail?.name ?? companyGulf?.Name ?? raw.company,
      location: locations ?? raw.Location ?? raw.location,
      description: raw.description ?? raw.Description ?? raw.jobDescription,
      salary:
        comp && (comp.MinCtc || comp.MaxCtc)
          ? [comp.MinCtc, comp.MaxCtc].filter(Boolean).join(" - ")
          : raw.salary,
    };
  },
};

export const apifySource: JobSource = {
  id: "apify",
  label: "Apify",
  requires: "apifyToken",

  async scrape(creds: SourceCreds, params: ScrapeParams): Promise<JobPosting[]> {
    if (!creds.apifyToken) throw new SourceError("Missing Apify token.");
    // Accept either console form (username/actor) or API form (username~actor).
    const actorId = params.actorId?.trim().replace(/\//g, "~");
    if (!actorId) throw new SourceError("Choose an Apify actor to run.");

    const preset = KNOWN_ACTORS[actorId];
    const input =
      params.rawInput && Object.keys(params.rawInput).length > 0
        ? // Power users: use their JSON exactly (actors validate their schema).
          params.rawInput
        : preset
          ? // Known actor: build its input from the friendly fields — no JSON.
            preset(params)
          : {
            // Common aliases across job-scraper actors (unknown keys are
            // typically ignored; use raw JSON for strict-schema actors).
            position: params.keywords,
            query: params.keywords,
            queries: params.keywords,
            search: params.keywords,
            location: params.location,
            maxItems: params.maxItems,
            maxResults: params.maxItems,
            ...(params.experience
              ? {
                  experience: params.experience,
                  experienceLevel: APIFY_EXPERIENCE[params.experience],
                }
              : {}),
          };

    const res = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(
        actorId
      )}/run-sync-get-dataset-items`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${creds.apifyToken}`,
        },
        body: JSON.stringify(input),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new SourceError(
        `Apify run failed (${res.status}). ${detail.slice(0, 200)}`
      );
    }

    const items = (await res.json()) as unknown;
    if (!Array.isArray(items)) return [];
    const mapper = ITEM_MAPPERS[actorId];
    return items
      .map((it) => {
        const raw = it as Record<string, unknown>;
        return normalizeJob(mapper ? mapper(raw) : raw, "apify");
      })
      .filter((j): j is JobPosting => j !== null);
  },
};
