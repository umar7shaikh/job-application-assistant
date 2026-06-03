"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, scrapeRuns, jobs } from "@builder/db";
import { requireUser } from "@/lib/dal";
import {
  jobSources,
  getUserSourceCreds,
  SourceError,
  type ExperienceLevel,
  type DatePosted,
} from "@/lib/sources";

export type ScrapeState =
  | { ok?: boolean; error?: string; found?: number; inserted?: number }
  | undefined;

export async function runScrape(
  _prev: ScrapeState,
  formData: FormData
): Promise<ScrapeState> {
  const user = await requireUser();
  const sourceId = String(formData.get("source") ?? "apify");
  const source = jobSources[sourceId];
  if (!source) return { error: "Unknown source." };

  const keywords = String(formData.get("keywords") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const maxItems = Math.min(100, Math.max(1, Number(formData.get("maxItems")) || 25));
  const experience = String(formData.get("experience") ?? "") as ExperienceLevel;
  const datePosted = String(formData.get("datePosted") ?? "") as DatePosted;
  const searchUrls = String(formData.get("searchUrls") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
  const actorId = String(formData.get("actorId") ?? "").trim() || undefined;
  const rawInputStr = String(formData.get("rawInput") ?? "").trim();

  if (!keywords && sourceId === "jsearch") {
    return { error: "Enter keywords to search." };
  }

  let rawInput: Record<string, unknown> | undefined;
  if (rawInputStr) {
    try {
      rawInput = JSON.parse(rawInputStr);
    } catch {
      return { error: "Advanced input is not valid JSON." };
    }
  }

  const creds = await getUserSourceCreds(user.id);
  if (source.requires === "apifyToken" && !creds.apifyToken) {
    return { error: "Connect your Apify token in Settings first." };
  }
  if (source.requires === "rapidApiKey" && !creds.rapidApiKey) {
    return { error: "Connect your RapidAPI (JSearch) key in Settings first." };
  }

  const [run] = await db
    .insert(scrapeRuns)
    .values({
      userId: user.id,
      source: source.id,
      query: { keywords, location, maxItems, experience, actorId },
      status: "running",
    })
    .returning({ id: scrapeRuns.id });

  try {
    const postings = await source.scrape(creds, {
      keywords,
      location,
      maxItems,
      experience,
      datePosted,
      searchUrls,
      actorId,
      rawInput,
    });

    let inserted = 0;
    if (postings.length > 0) {
      const rows = postings.map((p) => ({
        userId: user.id,
        scrapeRunId: run.id,
        ...p,
      }));
      const res = await db
        .insert(jobs)
        .values(rows)
        .onConflictDoNothing()
        .returning({ id: jobs.id });
      inserted = res.length;
    }

    await db
      .update(scrapeRuns)
      .set({ status: "succeeded", jobCount: inserted, finishedAt: new Date() })
      .where(eq(scrapeRuns.id, run.id));
    revalidatePath("/jobs");
    return { ok: true, found: postings.length, inserted };
  } catch (err) {
    const msg =
      err instanceof SourceError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Scrape failed.";
    await db
      .update(scrapeRuns)
      .set({ status: "failed", error: msg, finishedAt: new Date() })
      .where(eq(scrapeRuns.id, run.id));
    return { error: msg };
  }
}

export type AddJobState = { error?: string } | undefined;

/**
 * Add a job by pasting its description — no scraper/API keys needed. Stored as a
 * normal job (source "manual") so it flows through scoring, tailoring, and
 * tracking exactly like a scraped one.
 */
export async function addManualJob(
  _prev: AddJobState,
  formData: FormData
): Promise<AddJobState> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const jdText = String(formData.get("jdText") ?? "").trim();

  if (!title) return { error: "Add a job title." };
  if (jdText.length < 30) {
    return { error: "Paste the full job description (a bit more text)." };
  }

  const [created] = await db
    .insert(jobs)
    .values({
      userId: user.id,
      source: "manual",
      sourceJobId: crypto.randomUUID(), // unique per paste; satisfies dedupe index
      title,
      company,
      location,
      url,
      jdText,
    })
    .returning({ id: jobs.id });

  revalidatePath("/jobs");
  redirect(`/jobs/${created.id}`);
}

export async function deleteJob(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await db
    .delete(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.userId, user.id)));
  revalidatePath("/jobs");
}
