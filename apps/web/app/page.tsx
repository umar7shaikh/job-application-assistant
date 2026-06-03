import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { Wordmark } from "@/components/brand";

const steps = [
  {
    k: "01",
    title: "Scrape",
    body: "Pull job listings and full descriptions from your sources via Apify.",
  },
  {
    k: "02",
    title: "Tailor",
    body: "Analyze each description and tailor your resume and cover letter to fit.",
  },
  {
    k: "03",
    title: "Apply",
    body: "Autofill the application form. You review and click submit — always.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/login" className="text-ink-soft hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-ink px-4 py-2 font-medium text-canvas transition-colors hover:bg-black"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="grid items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              Job applications, streamlined
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl">
              Apply to the right jobs,{" "}
              <span className="italic text-accent">intelligently.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              Lever scrapes jobs, reads the descriptions, and tailors your
              resume for each one — then fills in the application so all
              that&rsquo;s left is your final click.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
              >
                Create your account
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-ink-soft hover:text-ink"
              >
                I already have one →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-8">
            <p className="font-serif text-sm italic text-ink-soft">
              The honest part:
            </p>
            <p className="mt-2 leading-relaxed text-ink">
              We don&rsquo;t secretly auto-submit to LinkedIn or Naukri — that
              gets accounts banned. Lever automates everything up to the submit,
              and keeps you in control of the click.
            </p>
            <div className="mt-6 h-px bg-line" />
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-ink-faint">Your keys</dt>
                <dd className="mt-0.5 font-medium text-ink">Encrypted, BYO</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Your data</dt>
                <dd className="mt-0.5 font-medium text-ink">Private to you</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="border-t border-line py-16">
          <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.k} className="bg-surface p-7">
                <span className="font-serif text-sm tnum text-accent">
                  {s.k}
                </span>
                <h3 className="mt-3 font-serif text-2xl tracking-tight text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-sm text-ink-faint">
        © {new Date().getFullYear()} Lever — a personal project.
      </footer>
    </div>
  );
}
