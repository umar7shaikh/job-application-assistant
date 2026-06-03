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
      <p className="text-sm text-ink-soft">Dashboard</p>
      <h1 className="mt-1 font-serif text-4xl tracking-tight text-ink">
        Hello, {greetingName}.
      </h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Your workspace for finding, tailoring, and applying to jobs — without
        the busywork. Here&rsquo;s how to get set up.
      </p>

      <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.n} className="bg-surface p-6">
            <div className="flex items-center justify-between">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm tnum ${
                  step.done
                    ? "bg-accent text-white"
                    : "border border-line-strong text-ink-soft"
                }`}
              >
                {step.done ? "✓" : step.n}
              </span>
              {step.soon ? (
                <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-faint">
                  Coming soon
                </span>
              ) : step.done ? (
                <span className="text-xs font-medium text-accent">Done</span>
              ) : null}
            </div>
            <h2 className="mt-4 font-serif text-xl tracking-tight text-ink">
              {step.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {step.body}
            </p>
            {step.href ? (
              <Link
                href={step.href}
                className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
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
