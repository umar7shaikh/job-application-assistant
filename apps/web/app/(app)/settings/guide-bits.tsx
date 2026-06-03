import type { ReactNode } from "react";

/**
 * Shared building blocks for the on-brand "how to get your key" guides.
 * Hand-drawn mocks (never real screenshots) so no real account/key is exposed
 * and the guides don't rot when a provider redesigns its UI.
 */

export type GuideStep = { n: string; body: ReactNode };

export function GuideShell({
  summary = "Show me how to get my key",
  steps,
  children,
}: {
  summary?: string;
  steps: GuideStep[];
  children?: ReactNode;
}) {
  return (
    <details className="group mt-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border-2 border-ink bg-pop-yellow px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink transition-transform hover:-translate-y-0.5">
        <span className="transition-transform group-open:rotate-90">▸</span>
        {summary}
      </summary>

      <div className="mt-4 rounded-xl border-2 border-ink/15 bg-paper p-4">
        <ol className="space-y-2.5">
          {steps.map((s) => (
            <li key={s.n} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink bg-white font-comic text-sm text-ink">
                {s.n}
              </span>
              <span className="text-sm leading-relaxed text-ink/80">
                {s.body}
              </span>
            </li>
          ))}
        </ol>

        {children}

        <p className="mt-3 text-xs text-ink/50">
          Your key is stored encrypted — we never show it again after saving.
        </p>
      </div>
    </details>
  );
}

/** Comic faux-browser chrome wrapping a mocked provider page. */
export function FauxBrowser({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_var(--color-ink)]">
      <div className="flex items-center gap-2 border-b-[3px] border-ink bg-paper px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full border border-ink bg-pop-red" />
        <span className="h-2.5 w-2.5 rounded-full border border-ink bg-pop-yellow" />
        <span className="h-2.5 w-2.5 rounded-full border border-ink bg-pop-green" />
        <span className="ml-1 truncate rounded border-2 border-ink bg-white px-2 py-0.5 text-[10px] font-bold text-ink/55">
          {url}
        </span>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

/** The little red "copy this" callout used under each mock. */
export function CopyCallout({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 inline-block -rotate-1 rounded-md border-2 border-ink bg-pop-red px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
      {children}
    </p>
  );
}
