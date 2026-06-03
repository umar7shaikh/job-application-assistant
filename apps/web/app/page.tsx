import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";

/* --------------------------------------------------------------- Comic bits */

// Big chunky panel-number tab.
function PanelNo({ n, color }: { n: string; color: string }) {
  return (
    <span
      className={`ink-edge-sm inline-grid h-12 w-12 place-items-center rounded-full font-comic text-2xl text-ink ${color}`}
    >
      {n}
    </span>
  );
}

// Hand-drawn-feel doodles (thick ink strokes, no fill flourishes).
const stroke = {
  fill: "none",
  stroke: "#14171c",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconScrape() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
      <circle cx="21" cy="21" r="12" {...stroke} />
      <path d="M30 30l8 8" {...stroke} />
      <path d="M16 21h10M21 16v10" {...stroke} />
    </svg>
  );
}
function IconTailor() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
      <path d="M14 6h14l8 8v28H14z" {...stroke} />
      <path d="M28 6v8h8" {...stroke} />
      <path d="M19 24l3 3 7-7" {...stroke} />
      <path d="M19 33h12" {...stroke} />
    </svg>
  );
}
function IconApply() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
      <path d="M14 10l22 11-9 3-3 9z" {...stroke} />
      <path d="M26 26l9 9" {...stroke} />
    </svg>
  );
}

const steps = [
  {
    n: "1",
    tab: "bg-pop-yellow",
    icon: <IconScrape />,
    title: "SCRAPE",
    body: "Bring your own Apify or JSearch key. Lever pulls live openings and full job descriptions from your sources, then de-dupes them into one clean queue.",
  },
  {
    n: "2",
    tab: "bg-pop-blue text-white",
    icon: <IconTailor />,
    title: "SCORE & TAILOR",
    body: "An AI reads every description, scores how well you fit (0–100), flags the gaps, then rewrites your résumé and drafts a cover letter for that exact job — truthfully, never invented.",
  },
  {
    n: "3",
    tab: "bg-pop-green text-white",
    icon: <IconApply />,
    title: "APPLY & TRACK",
    body: "Download a crisp PDF (or Overleaf-ready LaTeX), let the browser extension autofill the form, and hit submit yourself. Lever logs it: role, résumé used, date, status.",
  },
];

const belt = [
  {
    title: "BYO KEYS, LOCKED UP",
    body: "Your Apify and AI keys are encrypted at rest (AES-256-GCM). Never logged, never shipped to the browser.",
    color: "bg-pop-yellow",
  },
  {
    title: "FIT SCORES",
    body: "See which jobs are actually worth your time — and the exact skills you're missing — before you spend an evening on them.",
    color: "bg-white",
  },
  {
    title: "ONE HONEST TRACKER",
    body: "Every application in one place: which résumé you sent, when, and where it stands. No spreadsheet archaeology.",
    color: "bg-white",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="halftone-bg min-h-screen bg-paper text-ink">
      {/* ---------------------------------------------------------- Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="select-none">
          <span className="ink-edge inline-block -rotate-2 rounded-lg bg-pop-red px-4 py-1 font-comic text-3xl tracking-wide text-white">
            LEVER
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href="#how"
            className="hidden rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-ink/70 hover:text-ink sm:block"
          >
            How it works
          </a>
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-ink/70 hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="ink-edge-sm rounded-md bg-ink px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-paper transition-transform hover:-translate-y-0.5"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* ---------------------------------------------------------- Hero */}
      <main className="mx-auto w-full max-w-6xl px-5">
        <section className="grid items-center gap-12 py-12 md:grid-cols-[1.15fr_0.85fr] md:py-16">
          <div>
            <span className="ink-edge-sm inline-block rotate-1 rounded-full bg-pop-yellow px-4 py-1 font-comic text-lg tracking-wide">
              ★ ISSUE #1 · THE GREAT JOB HUNT
            </span>

            <h1 className="mt-6 font-comic text-6xl leading-[0.92] tracking-wide sm:text-7xl md:text-[5.5rem]">
              QUIT SPRAY-AND-PRAYING
              <br />
              YOUR JOB{" "}
              <span className="bg-pop-yellow px-2 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                APPLICATIONS.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-ink/80">
              Lever is your sidekick for the job hunt. It scrapes real openings,
              reads every job description, and rewrites your résumé to match —
              then fills in the application form so the only thing left is your
              final click.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="ink-edge rounded-lg bg-pop-green px-7 py-3.5 font-comic text-2xl tracking-wide text-white transition-transform hover:-translate-y-0.5"
              >
                START — IT&rsquo;S FREE
              </Link>
              <Link
                href="/login"
                className="text-sm font-bold uppercase tracking-wide text-ink/70 underline-offset-4 hover:text-ink hover:underline"
              >
                I already have an account →
              </Link>
            </div>
          </div>

          {/* Hero comic strip */}
          <div className="relative">
            <div className="speech rotate-1 p-4 text-center">
              <p className="font-comic text-xl leading-tight tracking-wide">
                “Same résumé for 200 jobs? No wonder nobody&rsquo;s calling
                back…”
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              {steps.map((s, i) => (
                <div
                  key={s.n}
                  className={`ink-edge flex items-center gap-4 rounded-xl bg-white p-4 ${
                    i % 2 === 0 ? "-rotate-1" : "rotate-1"
                  }`}
                >
                  <PanelNo n={s.n} color={s.tab} />
                  <div className="shrink-0">{s.icon}</div>
                  <div>
                    <p className="font-comic text-xl tracking-wide">
                      {s.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Starburst */}
            <div className="starburst absolute -right-3 -top-7 grid h-24 w-24 rotate-6 place-items-center bg-pop-red text-center">
              <span className="font-comic text-base leading-none text-white">
                0<br />
                BANS
              </span>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ The one rule */}
        <section id="rule" className="py-10">
          <div className="mb-8 text-center">
            <h2 className="font-comic text-5xl tracking-wide sm:text-6xl">
              THE ONE RULE WE NEVER BREAK
            </h2>
            <p className="mx-auto mt-3 max-w-2xl font-medium text-ink/70">
              Auto-submitting bots get LinkedIn and Naukri accounts banned. So we
              don&rsquo;t. A human always lands the final hit.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Villain */}
            <div className="ink-edge -rotate-1 rounded-2xl bg-pop-red p-7 text-white">
              <span className="inline-block rounded-md bg-white/15 px-3 py-1 font-comic text-xl tracking-wide">
                ✗ THE TRAP
              </span>
              <h3 className="mt-4 font-comic text-3xl leading-tight tracking-wide">
                AUTO-SPAM BOTS
              </h3>
              <p className="mt-3 font-medium leading-relaxed text-white/90">
                Tools that secretly mass-submit to job boards. The result:
                flagged behaviour, CAPTCHA roulette, shadow-bans — and a dead
                account when you needed it most. <strong>BOOM. Gone.</strong>
              </p>
            </div>

            {/* Hero */}
            <div className="ink-edge rotate-1 rounded-2xl bg-pop-green p-7 text-white">
              <span className="inline-block rounded-md bg-white/15 px-3 py-1 font-comic text-xl tracking-wide">
                ✓ THE LEVER WAY
              </span>
              <h3 className="mt-4 font-comic text-3xl leading-tight tracking-wide">
                YOU LAND THE PUNCH
              </h3>
              <p className="mt-3 font-medium leading-relaxed text-white/90">
                Lever automates everything <em>up to</em> the submit. You review
                each application and click submit yourself. No bans, no
                brittleness — works across every Workday, Greenhouse, Lever and
                Ashby form.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ How it works */}
        <section id="how" className="py-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-comic text-5xl tracking-wide sm:text-6xl">
              THE THREE-PANEL PLAN
            </h2>
            <div className="speedlines hidden h-12 flex-1 rounded sm:block" />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <article
                key={s.n}
                className="ink-edge flex flex-col rounded-2xl bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <PanelNo n={s.n} color={s.tab} />
                  <span className="text-ink/80">{s.icon}</span>
                </div>
                <h3 className="mt-5 font-comic text-3xl tracking-wide">
                  {s.title}
                </h3>
                <p className="mt-2 font-medium leading-relaxed text-ink/75">
                  {s.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------ Utility belt */}
        <section className="py-12">
          <h2 className="mb-8 text-center font-comic text-5xl tracking-wide sm:text-6xl">
            THE UTILITY BELT
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {belt.map((c) => (
              <div
                key={c.title}
                className={`ink-edge rounded-2xl p-6 ${c.color}`}
              >
                <h3 className="font-comic text-2xl tracking-wide">{c.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-ink/75">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------ Final CTA */}
        <section className="py-14">
          <div className="ink-edge relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-paper">
            <div className="halftone absolute inset-0 text-pop-yellow/20" />
            <div className="relative">
              <span className="starburst mx-auto mb-6 grid h-20 w-20 -rotate-6 place-items-center bg-pop-yellow">
                <span className="font-comic text-2xl text-ink">FREE</span>
              </span>
              <h2 className="font-comic text-5xl leading-none tracking-wide sm:text-7xl">
                READY TO SUIT UP?
              </h2>
              <p className="mx-auto mt-4 max-w-md font-medium text-paper/80">
                Spin up your account, plug in your keys, and let Lever do the
                grunt work. You keep the cape — and the final click.
              </p>
              <Link
                href="/signup"
                className="ink-edge mt-8 inline-block rounded-lg bg-pop-green px-8 py-4 font-comic text-3xl tracking-wide text-white transition-transform hover:-translate-y-0.5"
              >
                CREATE YOUR ACCOUNT
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------------------------------------------------- Footer */}
      <footer className="mx-auto w-full max-w-6xl px-5 pb-10 pt-2">
        <div className="flex flex-col items-center justify-between gap-3 border-t-2 border-ink/15 pt-6 sm:flex-row">
          <span className="ink-edge-sm inline-block -rotate-2 rounded bg-pop-red px-3 py-0.5 font-comic text-xl text-white">
            LEVER
          </span>
          <p className="text-center text-sm font-medium text-ink/60">
            © {new Date().getFullYear()} Lever — a personal project. No bots were
            banned in the making of this app.
          </p>
        </div>
      </footer>
    </div>
  );
}
