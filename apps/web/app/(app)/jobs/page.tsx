import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db, jobs, scrapeRuns, userSecrets, jobMatches, masterProfiles } from "@builder/db";
import { requireUser } from "@/lib/dal";
import { deleteJob } from "@/app/actions/jobs";
import { ScoreChip } from "@/components/fit-card";
import { JobIntake } from "./job-intake";
import { ScoreAllButton } from "./score-all-button";

export const metadata: Metadata = { title: "Jobs · Lever" };

const statusColor: Record<string, string> = {
  succeeded: "text-accent",
  running: "text-ink-soft",
  failed: "text-danger",
  pending: "text-ink-faint",
};

export default async function JobsPage() {
  const user = await requireUser();

  const [secrets] = await db
    .select({
      apifyKeyEnc: userSecrets.apifyKeyEnc,
      rapidapiKeyEnc: userSecrets.rapidapiKeyEnc,
    })
    .from(userSecrets)
    .where(eq(userSecrets.userId, user.id))
    .limit(1);

  const runs = await db
    .select()
    .from(scrapeRuns)
    .where(eq(scrapeRuns.userId, user.id))
    .orderBy(desc(scrapeRuns.createdAt))
    .limit(4);

  const rawFound = await db
    .select()
    .from(jobs)
    .where(eq(jobs.userId, user.id))
    .orderBy(desc(jobs.scrapedAt))
    .limit(100);

  // Fit scores against the default resume (if any), for chips + ranking.
  const [profile] = await db
    .select({ id: masterProfiles.id })
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, user.id))
    .orderBy(desc(masterProfiles.isDefault), desc(masterProfiles.updatedAt))
    .limit(1);

  const scores = new Map<string, number>();
  if (profile) {
    const matches = await db
      .select({ jobId: jobMatches.jobId, fit: jobMatches.fit })
      .from(jobMatches)
      .where(
        and(eq(jobMatches.userId, user.id), eq(jobMatches.profileId, profile.id))
      );
    for (const m of matches) scores.set(m.jobId, m.fit.score);
  }

  // Scored jobs first (highest fit), then the rest by recency.
  const found = [...rawFound].sort((a, b) => {
    const sa = scores.get(a.id);
    const sb = scores.get(b.id);
    if (sa != null && sb != null) return sb - sa;
    if (sa != null) return -1;
    if (sb != null) return 1;
    return 0;
  });
  const unscored = rawFound.some((j) => !scores.has(j.id));

  return (
    <div>
      <div>
        <p className="text-sm text-ink-soft">Jobs</p>
        <h1 className="mt-1 font-serif text-4xl tracking-tight text-ink">
          Find jobs
        </h1>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        {/* Search — pinned on the left so it never scrolls away on desktop. */}
        <div className="space-y-4 lg:sticky lg:top-10">
          <JobIntake
            apifyConnected={Boolean(secrets?.apifyKeyEnc)}
            rapidapiConnected={Boolean(secrets?.rapidapiKeyEnc)}
          />

          {runs.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs">
              {runs.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full border border-line bg-surface px-3 py-1 text-ink-soft"
                >
                  {r.source} ·{" "}
                  <span className={statusColor[r.status] ?? "text-ink-soft"}>
                    {r.status}
                  </span>
                  {r.status === "succeeded" ? ` · ${r.jobCount} new` : ""}
                  {r.status === "failed" && r.error
                    ? ` · ${r.error.slice(0, 40)}`
                    : ""}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Saved jobs — the scrolling area. */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl tracking-tight text-ink">
              Saved jobs
            </h2>
            <div className="flex items-center gap-4">
              {found.length > 0 && unscored ? <ScoreAllButton /> : null}
              <span className="text-sm text-ink-faint">
                {found.length} shown
              </span>
            </div>
          </div>

          {found.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-sm text-ink-soft">
              No jobs yet. Fill in the search on the left to find some.
            </p>
          ) : (
            <ul className="space-y-3">
              {found.map((j) => (
                <li
                  key={j.id}
                  className="rounded-xl border border-line bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/jobs/${j.id}`}
                        className="font-serif text-lg text-ink hover:text-accent"
                      >
                        {j.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-ink-soft">
                        {[j.company, j.location].filter(Boolean).join(" · ") ||
                          "—"}
                        {j.remote ? " · Remote" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {scores.has(j.id) ? (
                        <ScoreChip score={scores.get(j.id)!} />
                      ) : null}
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-faint">
                        {j.source}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <Link
                      href={`/jobs/${j.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      View →
                    </Link>
                    {j.url ? (
                      <a
                        href={j.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-soft hover:text-ink"
                      >
                        Original posting ↗
                      </a>
                    ) : null}
                    <form action={deleteJob} className="ml-auto">
                      <input type="hidden" name="id" value={j.id} />
                      <button className="text-ink-faint transition-colors hover:text-danger">
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
