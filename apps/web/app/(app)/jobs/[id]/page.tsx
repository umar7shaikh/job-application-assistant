import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  jobs,
  jobMatches,
  masterProfiles,
  tailoredDocuments,
  applications,
} from "@builder/db";
import { requireUser } from "@/lib/dal";
import { deleteJob } from "@/app/actions/jobs";
import { FitCard } from "@/components/fit-card";
import { ScoreButton } from "./score-button";
import { TailorButton } from "./tailor-button";
import { TrackButton } from "./track-button";

export const metadata: Metadata = { title: "Job · Lever" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.userId, user.id)))
    .limit(1);

  if (!job) notFound();

  // Resolve the default resume and any existing fit score for it.
  const [profile] = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, user.id))
    .orderBy(desc(masterProfiles.isDefault), desc(masterProfiles.updatedAt))
    .limit(1);

  const match = profile
    ? (
        await db
          .select()
          .from(jobMatches)
          .where(
            and(
              eq(jobMatches.jobId, job.id),
              eq(jobMatches.profileId, profile.id)
            )
          )
          .limit(1)
      )[0]
    : undefined;

  const docs = profile
    ? await db
        .select()
        .from(tailoredDocuments)
        .where(
          and(
            eq(tailoredDocuments.jobId, job.id),
            eq(tailoredDocuments.profileId, profile.id)
          )
        )
    : [];
  const resumeDoc = docs.find((d) => d.type === "resume");
  const coverDoc = docs.find((d) => d.type === "cover_letter");
  const coverBody =
    coverDoc && "body" in coverDoc.content ? coverDoc.content.body : "";

  const [tracked] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.userId, user.id), eq(applications.jobId, job.id)))
    .limit(1);

  return (
    <div className="max-w-3xl">
      <Link href="/jobs" className="text-sm text-ink-soft hover:text-ink">
        ← All jobs
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl leading-tight tracking-tight text-ink">
            {job.title}
          </h1>
          <p className="mt-1 text-ink-soft">
            {[job.company, job.location].filter(Boolean).join(" · ") || "—"}
            {job.remote ? " · Remote" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
            <span>Source: {job.source}</span>
            {job.salary ? <span>Salary: {job.salary}</span> : null}
            {job.postedAt ? <span>Posted: {job.postedAt}</span> : null}
          </div>
        </div>
        <form action={deleteJob}>
          <input type="hidden" name="id" value={job.id} />
          <button className="shrink-0 text-sm text-danger hover:underline">
            Delete
          </button>
        </form>
      </div>

      {job.url ? (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
        >
          Open original posting ↗
        </a>
      ) : null}

      <div className="mt-4">
        {tracked ? (
          <Link
            href="/applications"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            ✓ Tracked — view in Applications →
          </Link>
        ) : (
          <TrackButton jobId={job.id} />
        )}
      </div>

      <section className="mt-8 rounded-xl border border-line bg-surface p-6">
        <h2 className="font-serif text-xl tracking-tight text-ink">
          Job description
        </h2>
        {job.jdText ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
            {job.jdText}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-faint">
            No description text was captured for this listing.
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl tracking-tight text-ink">
            Fit analysis
          </h2>
          {profile && match ? (
            <ScoreButton jobId={job.id} label="Re-score" />
          ) : null}
        </div>

        {!profile ? (
          <p className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-8 text-center text-sm text-ink-soft">
            Add a resume first, then we can score this job against it.{" "}
            <Link href="/resumes" className="font-medium text-accent hover:underline">
              Add a resume →
            </Link>
          </p>
        ) : match ? (
          <FitCard fit={match.fit} analysis={job.jdAnalysis} />
        ) : (
          <div className="rounded-xl border border-line bg-surface p-6">
            <p className="mb-4 text-sm text-ink-soft">
              Score how well this role fits{" "}
              <span className="font-medium text-ink">{profile.name}</span> — we
              read the description, weigh skills and experience, and flag gaps.
            </p>
            <ScoreButton jobId={job.id} label="Score fit" />
          </div>
        )}
      </section>

      {profile ? (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl tracking-tight text-ink">
              Tailored application
            </h2>
            {resumeDoc ? (
              <TailorButton jobId={job.id} label="Regenerate" compact />
            ) : null}
          </div>

          {resumeDoc ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/api/documents/${resumeDoc.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
                >
                  Resume (PDF) ↗
                </a>
                <a
                  href={`/api/documents/${resumeDoc.id}/tex`}
                  className="rounded-md border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent"
                >
                  Resume (.tex for Overleaf) ↓
                </a>
                {coverDoc ? (
                  <>
                    <a
                      href={`/api/documents/${coverDoc.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent"
                    >
                      Cover letter (PDF) ↗
                    </a>
                    <a
                      href={`/api/documents/${coverDoc.id}/tex`}
                      className="rounded-md border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent"
                    >
                      Cover letter (.tex) ↓
                    </a>
                  </>
                ) : null}
              </div>
              {coverBody ? (
                <div className="rounded-xl border border-line bg-surface p-6">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Cover letter
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                    {coverBody}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-surface p-6">
              <p className="mb-4 text-sm text-ink-soft">
                Generate a resume reworded for this role plus a matching cover
                letter, both as polished PDFs. We only re-emphasize what&rsquo;s
                already in{" "}
                <span className="font-medium text-ink">{profile.name}</span> —
                nothing is fabricated.
              </p>
              <TailorButton jobId={job.id} label="Tailor for this job" />
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
