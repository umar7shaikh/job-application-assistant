import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, masterProfiles, userSecrets } from "@builder/db";
import { requireUser } from "@/lib/dal";
import { setDefaultResume } from "@/app/actions/resumes";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Resumes · Lever" };

export default async function ResumesPage() {
  const user = await requireUser();

  const profiles = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, user.id))
    .orderBy(desc(masterProfiles.isDefault), desc(masterProfiles.updatedAt));

  const [secrets] = await db
    .select({ aiKeyEnc: userSecrets.aiKeyEnc })
    .from(userSecrets)
    .where(eq(userSecrets.userId, user.id))
    .limit(1);

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-ink-soft">Resumes</p>
      <h1 className="mt-1 font-serif text-4xl tracking-tight text-ink">
        Your master profiles
      </h1>
      <p className="mt-3 text-ink-soft">
        Upload a resume and we&rsquo;ll parse it into a structured profile you can
        edit. Tailoring later draws from these.
      </p>

      <div className="mt-8">
        <UploadForm hasAi={Boolean(secrets?.aiKeyEnc)} />
      </div>

      {profiles.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {profiles.map((p) => {
            const roles = p.data.experience?.length ?? 0;
            const skills =
              p.data.skills?.reduce((n, g) => n + (g.skills?.length ?? 0), 0) ?? 0;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-line bg-surface p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/resumes/${p.id}`}
                      className="truncate font-serif text-lg text-ink hover:text-accent"
                    >
                      {p.name}
                    </Link>
                    {p.isDefault ? (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-strong">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {roles} role{roles === 1 ? "" : "s"} · {skills} skills
                    {p.sourceFileName ? ` · ${p.sourceFileName}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {!p.isDefault ? (
                    <form action={setDefaultResume}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-sm text-ink-soft hover:text-ink">
                        Set default
                      </button>
                    </form>
                  ) : null}
                  <Link
                    href={`/resumes/${p.id}`}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Edit →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
