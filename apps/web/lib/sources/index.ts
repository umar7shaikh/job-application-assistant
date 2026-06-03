import "server-only";
import { eq } from "drizzle-orm";
import { db, userSecrets } from "@builder/db";
import { decryptSecret } from "@/lib/crypto";
import type { JobSource, SourceCreds } from "./types";
import { apifySource } from "./apify";
import { jsearchSource } from "./jsearch";

export const jobSources: Record<string, JobSource> = {
  [apifySource.id]: apifySource,
  [jsearchSource.id]: jsearchSource,
};

export const jobSourceList = Object.values(jobSources);

/** Load + decrypt all of a user's scraping credentials. */
export async function getUserSourceCreds(userId: string): Promise<SourceCreds> {
  const [row] = await db
    .select()
    .from(userSecrets)
    .where(eq(userSecrets.userId, userId))
    .limit(1);
  return {
    apifyToken: row?.apifyKeyEnc ? decryptSecret(row.apifyKeyEnc) : undefined,
    rapidApiKey: row?.rapidapiKeyEnc
      ? decryptSecret(row.rapidapiKeyEnc)
      : undefined,
  };
}

export * from "./types";
