import { GuideShell, FauxBrowser, CopyCallout } from "./guide-bits";

/**
 * On-brand visual guide for grabbing an AI provider API key. Adapts its link to
 * whichever provider is currently selected in the form.
 */
export function AiGuide({
  providerLabel,
  consoleUrl,
}: {
  providerLabel?: string;
  consoleUrl?: string;
}) {
  let host = "your provider · API keys";
  if (consoleUrl) {
    try {
      host = new URL(consoleUrl).host;
    } catch {
      /* keep fallback */
    }
  }

  return (
    <GuideShell
      summary="Show me how to get my key"
      steps={[
        {
          n: "1",
          body: (
            <>
              Pick a <b>provider</b> above — ones marked{" "}
              <span className="rounded bg-pop-yellow px-1 font-bold text-ink">
                Free
              </span>{" "}
              have a no-cost tier.
            </>
          ),
        },
        {
          n: "2",
          body: consoleUrl ? (
            <>
              Open the{" "}
              <a
                href={consoleUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-accent hover:underline"
              >
                {providerLabel ?? "provider"} API keys
              </a>{" "}
              page (the picture below).
            </>
          ) : (
            <>Open your provider&rsquo;s API keys page.</>
          ),
        },
        {
          n: "3",
          body: (
            <>
              Click <b>Create new key</b>, then <b>Copy</b> it (you only see it
              once!).
            </>
          ),
        },
        {
          n: "4",
          body: (
            <>
              Paste it into the box above and hit <b>Save keys</b>. Done!
            </>
          ),
        },
      ]}
    >
      <FauxBrowser url={host}>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink/70">
              API keys
            </p>
            <span className="inline-flex items-center rounded-md border-2 border-ink bg-pop-green px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
              + Create new key
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg border-2 border-ink bg-paper p-2">
            <span className="shrink-0 text-[11px] font-bold text-ink/55">
              Secret key
            </span>
            <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink/70">
              ••••••••••••••••••••••••
            </code>
            <span className="inline-flex shrink-0 items-center rounded-md border-2 border-ink bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase text-ink">
              Copy
            </span>
          </div>
          <CopyCallout>☝ copy right after creating</CopyCallout>
        </div>
      </FauxBrowser>
    </GuideShell>
  );
}
