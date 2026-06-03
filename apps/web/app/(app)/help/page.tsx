import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Help · Lever" };

const steps = [
  {
    n: "1",
    title: "Connect your keys",
    tab: "bg-pop-yellow text-ink",
    body: "Lever runs on your own free API keys, so everything stays in your control. In Settings, add an Apify or JSearch key (to fetch jobs) and an AI key (to read and tailor). Every box has a “Show me how” guide with pictures.",
    href: "/settings",
    cta: "Go to Settings",
  },
  {
    n: "2",
    title: "Add your resume",
    tab: "bg-pop-blue text-white",
    body: "Upload your resume (PDF, Word, or just paste the text) and Lever turns it into an editable profile. Fix anything the AI misread — this is the master copy every tailored version is built from.",
    href: "/resumes",
    cta: "Go to Resumes",
  },
  {
    n: "3",
    title: "Find jobs",
    tab: "bg-pop-red text-white",
    body: "Search real openings with your key, or just paste a job description you found anywhere. Lever saves the full posting so it can score and tailor against it.",
    href: "/jobs",
    cta: "Go to Jobs",
  },
  {
    n: "4",
    title: "Score & tailor",
    tab: "bg-pop-green text-white",
    body: "Open any job to see a fit score (0–100) and the skills you’re missing. Hit Tailor and Lever rewrites your resume and writes a cover letter for that exact role — truthfully, never invented. Download as a PDF or Overleaf-ready LaTeX.",
    href: "/jobs",
    cta: "Go to Jobs",
  },
  {
    n: "5",
    title: "Apply & track",
    tab: "bg-ink text-paper",
    body: "Use the browser extension to auto-fill the company’s application form from your profile, eyeball it, and click submit yourself. Lever logs it so you always know what you applied to, with which resume, and when.",
    href: "/applications",
    cta: "Go to Applications",
  },
];

const facts = [
  {
    title: "It’s free",
    body: "You bring your own API keys, so there’s no cost to us — and nothing for you to pay.",
    color: "bg-pop-yellow",
  },
  {
    title: "Your keys are safe",
    body: "Keys are encrypted (AES-256) and never shown again or sent to your browser.",
    color: "bg-white",
  },
  {
    title: "You stay in control",
    body: "The extension fills forms but never submits. You always click the final Submit.",
    color: "bg-white",
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl">
      <span className="c-chip bg-pop-yellow text-ink">Help</span>
      <h1 className="mt-3 font-comic text-5xl tracking-wide text-ink">
        How Lever works
      </h1>
      <p className="mt-3 font-medium text-ink/75">
        The whole flow, start to finish — no jargon. Five steps from a blank
        account to a tracked application.
      </p>

      {/* The flow */}
      <ol className="mt-10 space-y-5">
        {steps.map((s) => (
          <li key={s.n} className="c-card flex flex-col gap-4 p-6 sm:flex-row">
            <span
              className={`ink-edge-sm grid h-12 w-12 shrink-0 place-items-center rounded-full font-comic text-2xl ${s.tab}`}
            >
              {s.n}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-comic text-2xl tracking-wide text-ink">
                {s.title}
              </h2>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink/75">
                {s.body}
              </p>
              <Link
                href={s.href}
                className="mt-3 inline-block text-sm font-extrabold uppercase tracking-wide text-ink underline-offset-4 hover:underline"
              >
                {s.cta} →
              </Link>
            </div>
          </li>
        ))}
      </ol>

      {/* The one rule */}
      <div className="ink-edge mt-8 rounded-2xl bg-pop-green p-6 text-white">
        <h2 className="font-comic text-2xl tracking-wide">
          The one rule we never break
        </h2>
        <p className="mt-2 font-medium leading-relaxed text-white/90">
          Lever never secretly submits applications for you. Bots that auto-apply
          get LinkedIn and Naukri accounts banned. You always click the final{" "}
          <b>Submit</b> yourself — that’s the whole point, and it keeps your
          accounts safe.
        </p>
      </div>

      {/* Good to know */}
      <h2 className="mt-10 font-comic text-3xl tracking-wide text-ink">
        Good to know
      </h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-3">
        {facts.map((f) => (
          <div key={f.title} className={`ink-edge rounded-2xl p-5 ${f.color}`}>
            <h3 className="font-comic text-xl tracking-wide text-ink">
              {f.title}
            </h3>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink/75">
              {f.body}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm font-medium text-ink/60">
        Stuck on the API keys? Each one has a step-by-step picture guide right on
        the{" "}
        <Link
          href="/settings"
          className="font-bold text-accent hover:underline"
        >
          Settings
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
