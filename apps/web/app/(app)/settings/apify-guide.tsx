/**
 * Static, on-brand visual guide for grabbing an Apify API token. Deliberately a
 * hand-drawn mock (not a real screenshot) so it never leaks a real account/token
 * and won't rot when Apify tweaks their UI.
 */
export function ApifyGuide() {
  const steps = [
    {
      n: "1",
      body: (
        <>
          Create a free account at{" "}
          <a
            href="https://console.apify.com/sign-up"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-accent hover:underline"
          >
            apify.com
          </a>{" "}
          (no card needed).
        </>
      ),
    },
    {
      n: "2",
      body: (
        <>
          Open the{" "}
          <a
            href="https://console.apify.com/settings/integrations"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-accent hover:underline"
          >
            Settings → Integrations
          </a>{" "}
          page (the picture below).
        </>
      ),
    },
    {
      n: "3",
      body: (
        <>
          Under <b>Personal API tokens</b>, click <b>Copy</b> on your token.
        </>
      ),
    },
    {
      n: "4",
      body: <>Paste it into the box above and hit <b>Save keys</b>. Done!</>,
    },
  ];

  return (
    <details className="group mt-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border-2 border-ink bg-pop-yellow px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink transition-transform hover:-translate-y-0.5">
        <span className="transition-transform group-open:rotate-90">▸</span>
        Show me how to get my token
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

        {/* ----- Faux browser mock of the Apify Integrations page ----- */}
        <div className="mt-4 overflow-hidden rounded-xl border-[3px] border-ink shadow-[5px_5px_0_0_var(--color-ink)]">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b-[3px] border-ink bg-paper px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full border border-ink bg-pop-red" />
            <span className="h-2.5 w-2.5 rounded-full border border-ink bg-pop-yellow" />
            <span className="h-2.5 w-2.5 rounded-full border border-ink bg-pop-green" />
            <span className="ml-1 truncate rounded border-2 border-ink bg-white px-2 py-0.5 text-[10px] font-bold text-ink/55">
              console.apify.com/settings/integrations
            </span>
          </div>

          {/* Body */}
          <div className="flex bg-white">
            {/* Sidebar */}
            <div className="hidden w-28 shrink-0 space-y-1 border-r-2 border-ink/15 p-2 text-[11px] font-semibold text-ink/45 sm:block">
              <p>Account</p>
              <p>Profile</p>
              <p className="rounded border-2 border-ink bg-pop-yellow px-1.5 py-0.5 font-extrabold text-ink">
                Integrations
              </p>
              <p>Billing</p>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-ink/70">
                Personal API tokens
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-lg border-2 border-ink bg-paper p-2">
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink/70">
                  apify_api_••••••••••••••••••••
                </code>
                <span className="inline-flex shrink-0 items-center rounded-md border-2 border-ink bg-pop-green px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                  Copy
                </span>
              </div>
              <p className="mt-2 inline-block -rotate-1 rounded-md border-2 border-ink bg-pop-red px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                ☝ copy this, paste above
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-ink/50">
          Your token is stored encrypted — we never show it again after saving.
        </p>
      </div>
    </details>
  );
}
