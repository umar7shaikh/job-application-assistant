import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, userSecrets, masterProfiles, jobs, applications } from "@builder/db";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Dashboard · Lever" };

type Step = {
  n: number;
  title: string;
  body: string;
  done: boolean;
  href?: string;
  cta?: string;
  soon?: boolean;
};

export default async function DashboardPage() {
  const user = await requireUser();
  const [secrets] = await db
    .select()
    .from(userSecrets)
    .where(eq(userSecrets.userId, user.id))
    .limit(1);

  const hasApify = Boolean(secrets?.apifyKeyEnc);
  const hasAi = Boolean(secrets?.aiKeyEnc);
  const keysConnected = hasApify && hasAi;

  const [resume] = await db
    .select({ id: masterProfiles.id })
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, user.id))
    .limit(1);
  const hasResume = Boolean(resume);

  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.userId, user.id))
    .limit(1);
  const hasJobs = Boolean(job);

  const [appRow] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.userId, user.id))
    .limit(1);
  const hasApplication = Boolean(appRow);

  const steps: Step[] = [
    {
      n: 1,
      title: "Connect your API keys",
      body: "Add your own Apify and AI keys. They're encrypted and only used on your behalf.",
      done: keysConnected,
      href: "/settings",
      cta: keysConnected ? "Manage keys" : "Connect keys",
    },
    {
      n: 2,
      title: "Add your resume",
      body: "Upload a PDF or DOCX. We parse it into a structured master profile you can edit.",
      done: hasResume,
      href: "/resumes",
      cta: hasResume ? "Manage resumes" : "Upload resume",
    },
    {
      n: 3,
      title: "Scrape jobs",
      body: "Pull listings and full descriptions from Apify or the free JSearch API.",
      done: hasJobs,
      href: "/jobs",
      cta: hasJobs ? "View jobs" : "Find jobs",
    },
    {
      n: 4,
      title: "Tailor, apply & track",
      body: "Score fit, tailor a resume + cover letter per role, then track every application.",
      done: hasApplication,
      href: "/applications",
      cta: hasApplication ? "View applications" : "See applications",
    },
  ];

  const greetingName = user.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <span className="ink-edge-sm inline-block rounded-full bg-pop-yellow px-3 py-0.5 font-comic text-base tracking-wide text-ink">
        DASHBOARD
      </span>
      <h1 className="mt-3 font-comic text-5xl tracking-wide text-ink">
        Hello, {greetingName}.
      </h1>
      <p className="mt-3 max-w-xl font-medium text-ink/75">
        Your workspace for finding, tailoring, and applying to jobs — without
        the busywork. Here&rsquo;s how to get set up.
      </p>

      <ol className="mt-10 grid gap-5 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.n} className="ink-edge rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <span
                className={`ink-edge-sm grid h-10 w-10 place-items-center rounded-full font-comic text-xl ${
                  step.done
                    ? "bg-pop-green text-white"
                    : "bg-pop-yellow text-ink"
                }`}
              >
                {step.done ? "✓" : step.n}
              </span>
              {step.done ? (
                <span className="text-xs font-extrabold uppercase tracking-wide text-pop-green">
                  Done
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 font-comic text-2xl tracking-wide text-ink">
              {step.title}
            </h2>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink/75">
              {step.body}
            </p>
            {step.href ? (
              <Link
                href={step.href}
                className="mt-4 inline-block text-sm font-extrabold uppercase tracking-wide text-ink underline-offset-4 hover:underline"
              >
                {step.cta} →
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
