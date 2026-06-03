import { jobPostingSchema, type JobPosting } from "@builder/shared";

export class SourceError extends Error {}

export type SourceCreds = { apifyToken?: string; rapidApiKey?: string };

/**
 * Experience filter. Values match JSearch's `job_requirements` vocabulary so
 * they pass straight through; other sources map them best-effort.
 */
export type ExperienceLevel =
  | ""
  | "no_experience"
  | "under_3_years_experience"
  | "more_than_3_years_experience";

export const experienceOptions: { value: ExperienceLevel; label: string }[] = [
  { value: "", label: "Any experience" },
  { value: "no_experience", label: "Fresher / no experience" },
  { value: "under_3_years_experience", label: "Under 3 years" },
  { value: "more_than_3_years_experience", label: "3+ years (mid / senior)" },
];

/** "Date posted" filter. Values are LinkedIn's f_TPR seconds-window codes. */
export type DatePosted = "" | "r86400" | "r604800" | "r2592000";

export const datePostedOptions: { value: DatePosted; label: string }[] = [
  { value: "", label: "Any time" },
  { value: "r86400", label: "Past 24 hours" },
  { value: "r604800", label: "Past week" },
  { value: "r2592000", label: "Past month" },
];

export type ScrapeParams = {
  keywords: string;
  location: string;
  maxItems: number;
  experience?: ExperienceLevel;
  /** Recency filter (currently applied to the LinkedIn search URL). */
  datePosted?: DatePosted;
  /** LinkedIn: paste ready-made search URLs; overrides the built-from-fields URL. */
  searchUrls?: string[];
  /** Apify-only: which actor to run, and an optional raw input override. */
  actorId?: string;
  rawInput?: Record<string, unknown>;
};

export interface JobSource {
  id: string;
  label: string;
  /** Which credential this source needs (for a friendly "connect key" message). */
  requires: keyof SourceCreds;
  scrape(creds: SourceCreds, params: ScrapeParams): Promise<JobPosting[]>;
}

/**
 * Best-effort normalization of a raw scraped record into our JobPosting shape.
 * Job scrapers vary wildly in field names, so we probe common aliases.
 */
export function normalizeJob(
  raw: Record<string, unknown>,
  sourceId: string
): JobPosting | null {
  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = raw[k];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
    return "";
  };
  const stripHtml = (s: string) =>
    s
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const title = pick("title", "jobTitle", "job_title", "position", "positionName");
  const url = pick("url", "jobUrl", "job_url", "link", "applyUrl", "job_apply_link", "externalUrl");
  if (!title && !url) return null;

  const company = pick("company", "companyName", "company_name", "employer_name", "employer");
  const location =
    pick("location", "jobLocation", "formattedLocation", "job_city") ||
    [pick("job_city"), pick("job_state"), pick("job_country")].filter(Boolean).join(", ");
  const sourceJobId =
    pick("id", "jobId", "job_id", "jobPostingId") || url || `${title}::${company}`;

  const parsed = jobPostingSchema.safeParse({
    source: sourceId,
    sourceJobId: sourceJobId.slice(0, 300),
    title: title || "(untitled role)",
    company,
    location,
    url,
    remote:
      raw.job_is_remote === true ||
      /\bremote\b/i.test(pick("location", "workplaceType", "title")),
    jdText: stripHtml(
      pick(
        "description",
        "descriptionText",
        "job_description",
        "jobDescription",
        "jobDescriptionText",
        "descriptionHtml",
        "details",
        "jobDescriptionHtml",
        "snippet"
      )
    ),
    salary: pick("salary", "salaryInfo", "job_salary", "compensation"),
    postedAt: pick("postedAt", "postedDate", "job_posted_at_datetime_utc", "publishedAt", "date"),
  });
  return parsed.success ? parsed.data : null;
}
