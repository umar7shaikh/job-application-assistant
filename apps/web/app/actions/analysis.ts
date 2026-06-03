"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db, jobs, jobMatches, masterProfiles } from "@builder/db";
import { requireUser } from "@/lib/dal";
import { getUserAi, AiError } from "@/lib/ai";
import { analyzeAndScore } from "@/lib/analysis";

export type ScoreState = { ok?: boolean; error?: string } | undefined;

async function defaultProfile(userId: string) {
  const [row] = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, userId))
    .orderBy(desc(masterProfiles.isDefault), desc(masterProfiles.updatedAt))
    .limit(1);
  return row ?? null;
}

export async function scoreJob(
  _prev: ScoreState,
  formData: FormData
): Promise<ScoreState> {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");

  const creds = await getUserAi(user.id);
  if (!creds) return { error: "Connect an AI key in Settings first." };

  const profile = await defaultProfile(user.id);
  if (!profile) return { error: "Add a resume first so we can score against it." };

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, user.id)))
    .limit(1);
  if (!job) return { error: "Job not found." };

  try {
    const { analysis, fit } = await analyzeAndScore(job.jdText, profile.data, creds);
    await db.update(jobs).set({ jdAnalysis: analysis }).where(eq(jobs.id, job.id));
    await db
      .insert(jobMatches)
      .values({ userId: user.id, jobId: job.id, profileId: profile.id, fit })
      .onConflictDoUpdate({
        target: [jobMatches.jobId, jobMatches.profileId],
        set: { fit, createdAt: new Date() },
      });
    revalidatePath(`/jobs/${job.id}`);
    revalidatePath("/jobs");
    return { ok: true };
  } catch (err) {
    return {
      error:
        err instanceof AiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Scoring failed.",
    };
  }
}

const BATCH_LIMIT = 12;

export type ScoreAllState =
  | {
      scored?: number;
      skippedNoJd?: number;
      failed?: number;
      remaining?: number;
      error?: string;
    }
  | undefined;

/** Score not-yet-scored jobs (up to BATCH_LIMIT) against the default resume. */
export async function scoreAllJobs(
  _prev: ScoreAllState,
  _formData: FormData
): Promise<ScoreAllState> {
  const user = await requireUser();
  const creds = await getUserAi(user.id);
  if (!creds) return { error: "Connect an AI key in Settings first." };
  const profile = await defaultProfile(user.id);
  if (!profile) return { error: "Add a resume first so we can score against it." };

  const all = await db
    .select()
    .from(jobs)
    .where(eq(jobs.userId, user.id))
    .orderBy(desc(jobs.scrapedAt))
    .limit(100);

  const already = await db
    .select({ jobId: jobMatches.jobId })
    .from(jobMatches)
    .where(
      and(eq(jobMatches.userId, user.id), eq(jobMatches.profileId, profile.id))
    );
  const done = new Set(already.map((s) => s.jobId));

  const unscored = all.filter((j) => !done.has(j.id));
  const skippedNoJd = unscored.filter((j) => !j.jdText || j.jdText.length <= 30).length;
  const candidates = unscored.filter((j) => j.jdText && j.jdText.length > 30);
  const batch = candidates.slice(0, BATCH_LIMIT);

  let scored = 0;
  let failed = 0;
  for (const job of batch) {
    try {
      const { analysis, fit } = await analyzeAndScore(job.jdText, profile.data, creds);
      await db.update(jobs).set({ jdAnalysis: analysis }).where(eq(jobs.id, job.id));
      await db
        .insert(jobMatches)
        .values({ userId: user.id, jobId: job.id, profileId: profile.id, fit })
        .onConflictDoUpdate({
          target: [jobMatches.jobId, jobMatches.profileId],
          set: { fit, createdAt: new Date() },
        });
      scored++;
    } catch {
      failed++;
    }
  }

  revalidatePath("/jobs");
  return {
    scored,
    skippedNoJd,
    failed,
    remaining: Math.max(0, candidates.length - batch.length),
  };
}
