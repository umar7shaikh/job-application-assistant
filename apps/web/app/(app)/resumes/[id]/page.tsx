import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, masterProfiles } from "@builder/db";
import { masterProfileSchema } from "@builder/shared";
import { requireUser } from "@/lib/dal";
import { deleteResume, setDefaultResume } from "@/app/actions/resumes";
import { ResumeWorkspace } from "./resume-workspace";

export const metadata: Metadata = { title: "Edit resume · Lever" };

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [profile] = await db
    .select()
    .from(masterProfiles)
    .where(and(eq(masterProfiles.id, id), eq(masterProfiles.userId, user.id)))
    .limit(1);

  if (!profile) notFound();

  // Normalize through the schema so older rows gain defaults for any fields
  // added since they were saved (e.g. customSections).
  const data = masterProfileSchema.parse(profile.data);

  return (
    <div>
      <Link href="/resumes" className="text-sm text-ink-soft hover:text-ink">
        ← All resumes
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-ink">
            Edit profile
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Parsed from {profile.sourceFileName ?? "upload"}. Tweak anything the
            AI got wrong.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-1">
          {!profile.isDefault ? (
            <form action={setDefaultResume}>
              <input type="hidden" name="id" value={profile.id} />
              <button className="text-sm text-ink-soft hover:text-ink">
                Set default
              </button>
            </form>
          ) : (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-strong">
              Default
            </span>
          )}
          <form action={deleteResume}>
            <input type="hidden" name="id" value={profile.id} />
            <button className="text-sm text-danger hover:underline">
              Delete
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <ResumeWorkspace id={profile.id} name={profile.name} data={data} />
      </div>
    </div>
  );
}
