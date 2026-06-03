"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { applicationStatus, type ApplicationStatus } from "@builder/shared";
import {
  db,
  applications,
  jobs,
  masterProfiles,
  tailoredDocuments,
} from "@builder/db";
import { requireUser } from "@/lib/dal";

export type TrackState = { ok?: boolean; error?: string } | undefined;

async function defaultProfile(userId: string) {
  const [row] = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, userId))
    .orderBy(desc(masterProfiles.isDefault), desc(masterProfiles.updatedAt))
    .limit(1);
  return row ?? null;
}

/** Add a job to the applications tracker (links the tailored docs if present). */
export async function trackApplication(
  _prev: TrackState,
  formData: FormData
): Promise<TrackState> {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");

  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, user.id)))
    .limit(1);
  if (!job) return { error: "Job not found." };

  const profile = await defaultProfile(user.id);

  // Don't double-track the same job for the same profile.
  const existing = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(eq(applications.userId, user.id), eq(applications.jobId, jobId))
    )
    .limit(1);
  if (existing.length > 0) return { ok: true };

  const docs = profile
    ? await db
        .select()
        .from(tailoredDocuments)
        .where(
          and(
            eq(tailoredDocuments.jobId, jobId),
            eq(tailoredDocuments.profileId, profile.id)
          )
        )
    : [];

  await db.insert(applications).values({
    userId: user.id,
    jobId,
    profileId: profile?.id ?? null,
    resumeDocId: docs.find((d) => d.type === "resume")?.id ?? null,
    coverDocId: docs.find((d) => d.type === "cover_letter")?.id ?? null,
    status: "queued",
  });

  revalidatePath("/applications");
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

export async function updateApplicationStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!applicationStatus.includes(status as ApplicationStatus)) return;

  const [app] = await db
    .select({ appliedAt: applications.appliedAt })
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
    .limit(1);
  if (!app) return;

  await db
    .update(applications)
    .set({
      status: status as ApplicationStatus,
      // Stamp the applied date the first time it moves to "applied".
      appliedAt:
        status === "applied" && !app.appliedAt ? new Date() : app.appliedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));
  revalidatePath("/applications");
}

export async function deleteApplication(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));
  revalidatePath("/applications");
}
