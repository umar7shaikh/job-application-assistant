import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, applications, jobs, masterProfiles } from "@builder/db";
import { requireUser } from "@/lib/dal";
import { deleteApplication } from "@/app/actions/applications";
import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "Applications · Lever" };

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ApplicationsPage() {
  const user = await requireUser();

  // Join applications → job + resume name. Drizzle returns nested rows.
  const rows = await db
    .select({
      app: applications,
      jobTitle: jobs.title,
      jobCompany: jobs.company,
      jobUrl: jobs.url,
      resumeName: masterProfiles.name,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .leftJoin(masterProfiles, eq(applications.profileId, masterProfiles.id))
    .where(eq(applications.userId, user.id))
    .orderBy(desc(applications.createdAt));

  return (
    <div>
      <span className="c-chip bg-pop-yellow text-ink">Applications</span>
      <h1 className="mt-3 font-comic text-5xl tracking-wide text-ink">
        Application history
      </h1>
      <p className="mt-3 max-w-xl font-medium text-ink/75">
        Every job you&rsquo;re tracking — which resume you used, the status, and
        when you applied.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border-[2.5px] border-dashed border-ink/40 bg-white px-6 py-10 text-center text-sm font-medium text-ink/60">
          Nothing tracked yet. Open a job and choose{" "}
          <span className="font-bold text-ink">Track application</span>.
        </p>
      ) : (
        <div className="c-card mt-8 overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-[3px] border-ink bg-paper text-left text-xs font-extrabold uppercase tracking-wide text-ink/70">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Resume</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ app, jobTitle, jobCompany, jobUrl, resumeName }) => (
                <tr key={app.id} className="border-t-2 border-ink/10 bg-white">
                  <td className="px-4 py-3">
                    <Link
                      href={`/jobs/${app.jobId}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {jobTitle ?? "—"}
                    </Link>
                    <div className="text-xs text-ink-faint">
                      {jobCompany ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {resumeName ?? "—"}
                    <div className="mt-1 flex gap-2 text-xs">
                      {app.resumeDocId ? (
                        <a
                          href={`/api/documents/${app.resumeDocId}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline"
                        >
                          Résumé
                        </a>
                      ) : null}
                      {app.coverDocId ? (
                        <a
                          href={`/api/documents/${app.coverDocId}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline"
                        >
                          Cover
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect id={app.id} value={app.status} />
                  </td>
                  <td className="px-4 py-3 tnum text-ink-soft">
                    {fmtDate(app.appliedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {jobUrl ? (
                        <a
                          href={jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-ink-soft hover:text-ink"
                        >
                          Posting ↗
                        </a>
                      ) : null}
                      <form action={deleteApplication}>
                        <input type="hidden" name="id" value={app.id} />
                        <button className="text-xs text-ink-faint hover:text-danger">
                          Remove
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
