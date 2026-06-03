"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db, jobs, masterProfiles, tailoredDocuments } from "@builder/db";
import { requireUser } from "@/lib/dal";
import { getUserAi, AiError } from "@/lib/ai";
import { tailorResume, writeCoverLetter } from "@/lib/tailor";

export type TailorState = { ok?: boolean; error?: string } | undefined;

async function defaultProfile(userId: string) {
  const [row] = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, userId))
    .orderBy(desc(masterProfiles.isDefault), desc(masterProfiles.updatedAt))
    .limit(1);
  return row ?? null;
}

export async function generateTailored(
  _prev: TailorState,
  formData: FormData
): Promise<TailorState> {
  const user = await requireUser();
  const jobId = String(formData.get("jobId") ?? "");
  const mode =
    String(formData.get("mode") ?? "") === "aggressive"
      ? "aggressive"
      : "honest";

  const creds = await getUserAi(user.id);
  if (!creds) return { error: "Connect an AI key in Settings first." };
  const profile = await defaultProfile(user.id);
  if (!profile) return { error: "Add a resume first." };

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, user.id)))
    .limit(1);
  if (!job) return { error: "Job not found." };
  if (!job.jdText || job.jdText.length < 30) {
    return { error: "This job has no description to tailor against." };
  }

  const jobCtx = { title: job.title, company: job.company, jdText: job.jdText };

  try {
    const [tailored, coverBody] = await Promise.all([
      tailorResume(profile.data, jobCtx, creds, mode),
      writeCoverLetter(profile.data, jobCtx, creds),
    ]);

    // Carry the page-fit preference onto the tailored resume (the model
    // doesn't emit it) so its downloads honor the same layout.
    tailored.layout = profile.data.layout;

    const contactLine = [
      profile.data.contact.email,
      profile.data.contact.phone,
      profile.data.contact.location,
    ]
      .filter(Boolean)
      .join("  ·  ");

    // Replace any previous tailored docs for this job + profile.
    await db
      .delete(tailoredDocuments)
      .where(
        and(
          eq(tailoredDocuments.userId, user.id),
          eq(tailoredDocuments.jobId, job.id),
          eq(tailoredDocuments.profileId, profile.id)
        )
      );

    await db.insert(tailoredDocuments).values([
      {
        userId: user.id,
        jobId: job.id,
        profileId: profile.id,
        type: "resume",
        content: tailored,
      },
      {
        userId: user.id,
        jobId: job.id,
        profileId: profile.id,
        type: "cover_letter",
        content: {
          body: coverBody,
          name: profile.data.contact.fullName || profile.name,
          contactLine,
        },
      },
    ]);

    revalidatePath(`/jobs/${job.id}`);
    return { ok: true };
  } catch (err) {
    return {
      error:
        err instanceof AiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Tailoring failed.",
    };
  }
}
