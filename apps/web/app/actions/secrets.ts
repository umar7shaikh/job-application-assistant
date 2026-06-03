"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, userSecrets } from "@builder/db";
import { requireUser } from "@/lib/dal";
import { secretsSchema } from "@/lib/validation";
import { encryptSecret } from "@/lib/crypto";

export type SecretsState = { ok?: boolean; error?: string } | undefined;

export async function saveSecrets(
  _prev: SecretsState,
  formData: FormData
): Promise<SecretsState> {
  const user = await requireUser();

  const parsed = secretsSchema.safeParse({
    apifyKey: formData.get("apifyKey") ?? undefined,
    rapidApiKey: formData.get("rapidApiKey") ?? undefined,
    aiProvider: formData.get("aiProvider") || undefined,
    aiKey: formData.get("aiKey") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "Please check the values and try again." };
  }
  const { apifyKey, rapidApiKey, aiProvider, aiKey } = parsed.data;

  // Read existing so blank fields leave the stored key untouched
  // (the form never receives the real key back, so blank = "no change").
  const [existing] = await db
    .select()
    .from(userSecrets)
    .where(eq(userSecrets.userId, user.id))
    .limit(1);

  const apifyKeyEnc = apifyKey
    ? encryptSecret(apifyKey)
    : existing?.apifyKeyEnc ?? null;
  const rapidapiKeyEnc = rapidApiKey
    ? encryptSecret(rapidApiKey)
    : existing?.rapidapiKeyEnc ?? null;
  const aiKeyEnc = aiKey ? encryptSecret(aiKey) : existing?.aiKeyEnc ?? null;
  const resolvedProvider = aiProvider ?? existing?.aiProvider ?? null;

  const values = {
    userId: user.id,
    apifyKeyEnc,
    rapidapiKeyEnc,
    aiProvider: resolvedProvider,
    aiKeyEnc,
    updatedAt: new Date(),
  };

  await db
    .insert(userSecrets)
    .values(values)
    .onConflictDoUpdate({
      target: userSecrets.userId,
      set: {
        apifyKeyEnc,
        rapidapiKeyEnc,
        aiProvider: resolvedProvider,
        aiKeyEnc,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/settings");
  return { ok: true };
}
