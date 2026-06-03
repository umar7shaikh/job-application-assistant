import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, scrapeRuns, jobs } from "@builder/db";
import { getUserSourceCreds } from "@/lib/sources";
import { resolveActorId, mapApifyItems } from "@/lib/sources/apify";

// Uses the database + node crypto (key decryption), so it must run on Node.
export const runtime = "nodejs";

/**
 * Apify completion webhook. Apify calls this when an actor run we started
 * asynchronously (see runScrape) finishes. On success we fetch the run's
 * dataset, normalize the items, and insert the jobs. On failure we mark the
 * scrape run failed.
 *
 * Auth is a shared secret in the query string (`?secret=...`), set when the
 * webhook was registered. The run we belong to is identified by `runRef` (our
 * scrapeRun id), with a fallback to the Apify run id from the payload.
 *
 * Idempotent: re-delivery is safe — job inserts use onConflictDoNothing and a
 * run already in a terminal state is left untouched.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const runRef = url.searchParams.get("runRef");

  if (!secret || secret !== process.env.APIFY_WEBHOOK_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // Apify sends { eventType, resource: { id, status, defaultDatasetId, ... } }.
  const payload = (await req.json().catch(() => null)) as {
    eventType?: string;
    resource?: {
      id?: string;
      status?: string;
      defaultDatasetId?: string;
    };
  } | null;

  const eventType = payload?.eventType ?? "";
  const resource = payload?.resource ?? {};
  const apifyRunId = resource.id;
  const datasetId = resource.defaultDatasetId;

  // Locate our scrape run: by our ref first, else by the Apify run id.
  let run:
    | {
        id: string;
        userId: string;
        status: string;
        query: Record<string, unknown>;
      }
    | undefined;
  if (runRef) {
    [run] = await db
      .select({
        id: scrapeRuns.id,
        userId: scrapeRuns.userId,
        status: scrapeRuns.status,
        query: scrapeRuns.query,
      })
      .from(scrapeRuns)
      .where(eq(scrapeRuns.id, runRef))
      .limit(1);
  }
  if (!run && apifyRunId) {
    [run] = await db
      .select({
        id: scrapeRuns.id,
        userId: scrapeRuns.userId,
        status: scrapeRuns.status,
        query: scrapeRuns.query,
      })
      .from(scrapeRuns)
      .where(eq(scrapeRuns.apifyRunId, apifyRunId))
      .limit(1);
  }

  // Nothing to do (unknown run) — ack so Apify stops retrying.
  if (!run) {
    return Response.json({ ok: true, ignored: "unknown-run" });
  }

  // Already finished (e.g. duplicate delivery) — ack without re-processing.
  if (run.status === "succeeded" || run.status === "failed") {
    return Response.json({ ok: true, ignored: "already-finished" });
  }

  const succeeded = eventType === "ACTOR.RUN.SUCCEEDED";

  if (!succeeded) {
    const reason =
      eventType.replace("ACTOR.RUN.", "").toLowerCase() ||
      resource.status?.toLowerCase() ||
      "failed";
    await db
      .update(scrapeRuns)
      .set({
        status: "failed",
        error: `Apify run ${reason}.`,
        finishedAt: new Date(),
      })
      .where(eq(scrapeRuns.id, run.id));
    revalidatePath("/jobs");
    return Response.json({ ok: true, status: "failed" });
  }

  try {
    // Reuse the exact decrypt path runScrape uses for the user's Apify token.
    const creds = await getUserSourceCreds(run.userId);
    if (!creds.apifyToken) {
      throw new Error("User's Apify token is no longer connected.");
    }
    if (!datasetId) {
      throw new Error("Apify run had no dataset.");
    }

    const res = await fetch(
      `https://api.apify.com/v2/datasets/${encodeURIComponent(
        datasetId
      )}/items?clean=true&token=${encodeURIComponent(creds.apifyToken)}`
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Could not read Apify dataset (${res.status}). ${detail.slice(0, 200)}`
      );
    }

    const items = (await res.json()) as unknown;
    const actorId = resolveActorId(
      typeof run.query.actorId === "string" ? run.query.actorId : undefined
    );
    const postings = mapApifyItems(actorId, items);

    let inserted = 0;
    if (postings.length > 0) {
      const rows = postings.map((p) => ({
        userId: run!.userId,
        scrapeRunId: run!.id,
        ...p,
      }));
      const insertedRows = await db
        .insert(jobs)
        .values(rows)
        .onConflictDoNothing()
        .returning({ id: jobs.id });
      inserted = insertedRows.length;
    }

    await db
      .update(scrapeRuns)
      .set({ status: "succeeded", jobCount: inserted, finishedAt: new Date() })
      .where(eq(scrapeRuns.id, run.id));
    revalidatePath("/jobs");
    return Response.json({ ok: true, status: "succeeded", inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to collect results.";
    await db
      .update(scrapeRuns)
      .set({ status: "failed", error: msg, finishedAt: new Date() })
      .where(eq(scrapeRuns.id, run.id));
    revalidatePath("/jobs");
    return Response.json({ ok: true, status: "failed", error: msg });
  }
}
