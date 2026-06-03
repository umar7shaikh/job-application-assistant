"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { masterProfileSchema } from "@builder/shared";
import { db, masterProfiles } from "@builder/db";
import { requireUser } from "@/lib/dal";
import { getUserAi, AiError } from "@/lib/ai";
import { extractResumeText, parseResumeToProfile } from "@/lib/resume-parse";

export type UploadState = { error?: string } | undefined;

export async function uploadResume(
  _prev: UploadState,
  formData: FormData
): Promise<UploadState> {
  const user = await requireUser();
  const pasted = String(formData.get("pastedText") ?? "").trim();
  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!pasted && !hasFile) {
    return { error: "Paste your resume text or choose a file." };
  }

  const creds = await getUserAi(user.id);
  if (!creds) {
    return {
      error: "Connect an AI provider key in Settings first — parsing needs it.",
    };
  }

  let profileId: string;
  try {
    // Pasted text (e.g. LaTeX source) parses more accurately than an
    // extracted PDF, so prefer it when present.
    const sourceName = pasted ? "Pasted resume" : (file as File).name;
    const text = pasted ? pasted : await extractResumeText(file as File);
    const data = await parseResumeToProfile(text, creds);

    const existing = await db
      .select({ id: masterProfiles.id })
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, user.id));

    const [created] = await db
      .insert(masterProfiles)
      .values({
        userId: user.id,
        name: deriveName(sourceName, data.contact.fullName),
        data,
        sourceFileName: sourceName,
        isDefault: existing.length === 0,
      })
      .returning({ id: masterProfiles.id });
    profileId = created.id;
  } catch (err) {
    if (err instanceof AiError) return { error: err.message };
    return {
      error:
        err instanceof Error ? err.message : "Failed to process that file.",
    };
  }

  redirect(`/resumes/${profileId}`);
}

export type SaveProfileState = { ok?: boolean; error?: string } | undefined;

export async function saveProfile(
  _prev: SaveProfileState,
  formData: FormData
): Promise<SaveProfileState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim() || "My Resume";

  let parsed;
  try {
    parsed = masterProfileSchema.parse(JSON.parse(String(formData.get("data"))));
  } catch {
    return { error: "Could not save — the profile data was invalid." };
  }

  const updated = await db
    .update(masterProfiles)
    .set({ name, data: parsed, updatedAt: new Date() })
    .where(and(eq(masterProfiles.id, id), eq(masterProfiles.userId, user.id)))
    .returning({ id: masterProfiles.id });

  if (updated.length === 0) return { error: "Resume not found." };
  revalidatePath(`/resumes/${id}`);
  revalidatePath("/resumes");
  return { ok: true };
}

export async function setDefaultResume(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  await db.transaction(async (tx) => {
    await tx
      .update(masterProfiles)
      .set({ isDefault: false })
      .where(eq(masterProfiles.userId, user.id));
    await tx
      .update(masterProfiles)
      .set({ isDefault: true })
      .where(and(eq(masterProfiles.id, id), eq(masterProfiles.userId, user.id)));
  });
  revalidatePath("/resumes");
}

export async function deleteResume(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await db
    .delete(masterProfiles)
    .where(and(eq(masterProfiles.id, id), eq(masterProfiles.userId, user.id)));
  revalidatePath("/resumes");
  redirect("/resumes");
}

/* helpers */

function deriveName(fileName: string, fullName: string): string {
  if (fullName) return `${fullName} — Resume`;
  return fileName.replace(/\.[^.]+$/, "") || "My Resume";
}
