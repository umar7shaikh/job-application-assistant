import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db, jobs, scrapeRuns, userSecrets, jobMatches, masterProfiles } from "@builder/db";
import type { MasterProfile } from "@builder/shared";
import { requireUser } from "@/lib/dal";
import { deleteJob } from "@/app/actions/jobs";
import { ScoreChip } from "@/components/fit-card";
import { JobIntake } from "./job-intake";
import { ScoreAllButton } from "./score-all-button";

export const metadata: Metadata = { title: "Jobs · Lever" };

/** Tap-to-add keyword chips drawn from the user's default résumé. */
function keywordsFromProfile(p: MasterProfile): string[] {
  const raw = [
    p.contact?.headline ?? "",
    ...(p.experience ?? []).map((e) => e.title),
    ...(p.skills ?? []).flatMap((g) => g.skills ?? []),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const k = (item ?? "").trim();
    if (!k || k.length > 32) continue;
    const low = k.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    out.push(k);
    if (out.length >= 16) break;
  }
  return out;
}

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
    .select({ id: masterProfiles.id, data: masterProfiles.data })
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, user.id))
    .orderBy(desc(masterProfiles.isDefault), desc(masterProfiles.updatedAt))
    .limit(1);

  const keywordSuggestions = profile ? keywordsFromProfile(profile.data) : [];
  const resumeLocation = (profile?.data?.contact?.location ?? "").trim();

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
        <span className="c-chip bg-pop-yellow text-ink">Jobs</span>
        <h1 className="mt-3 font-comic text-5xl tracking-wide text-ink">
          Find jobs
        </h1>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        {/* Search — pinned on the left so it never scrolls away on desktop. */}
        <div className="space-y-4 lg:sticky lg:top-10">
          <JobIntake
            apifyConnected={Boolean(secrets?.apifyKeyEnc)}
            rapidapiConnected={Boolean(secrets?.rapidapiKeyEnc)}
            keywordSuggestions={keywordSuggestions}
            resumeLocation={resumeLocation}
          />

          {runs.length > 0 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 text-xs">
                {runs.map((r) => (
                  <span
                    key={r.id}
                    className="rounded-full border-2 border-ink bg-white px-3 py-1 font-semibold text-ink/70"
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
              {runs.some((r) => r.status === "running" || r.status === "pending") ? (
                <p className="text-xs text-ink-faint">
                  A scrape is running — refresh in a bit to see new jobs.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Saved jobs — the scrolling area. */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-comic text-2xl tracking-wide text-ink">
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
            <p className="rounded-2xl border-[2.5px] border-dashed border-ink/40 bg-white px-6 py-10 text-center text-sm font-medium text-ink/60">
              No jobs yet. Fill in the search on the left to find some.
            </p>
          ) : (
            <ul className="space-y-3">
              {found.map((j) => (
                <li key={j.id} className="c-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/jobs/${j.id}`}
                        className="font-comic text-xl tracking-wide text-ink hover:text-pop-green"
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
                      <span className="rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs font-bold text-ink/60">
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
