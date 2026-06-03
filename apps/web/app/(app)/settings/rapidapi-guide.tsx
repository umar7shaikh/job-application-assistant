import { GuideShell, FauxBrowser, CopyCallout } from "./guide-bits";

/** On-brand visual guide for grabbing the JSearch (RapidAPI) key. */
export function RapidApiGuide() {
  return (
    <GuideShell
      summary="Show me how to get my key"
      steps={[
        {
          n: "1",
          body: (
            <>
              Create a free account at{" "}
              <a
                href="https://rapidapi.com/auth/sign-up"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-accent hover:underline"
              >
                rapidapi.com
              </a>
              .
            </>
          ),
        },
        {
          n: "2",
          body: (
            <>
              Open the{" "}
              <a
                href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-accent hover:underline"
              >
                JSearch API
              </a>{" "}
              page and click <b>Subscribe</b> → pick the <b>Basic (Free)</b> plan.
            </>
          ),
        },
        {
          n: "3",
          body: (
            <>
              On the <b>Endpoints</b> tab, find <b>X-RapidAPI-Key</b> in the code
              panel and copy it (the picture below).
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
      <FauxBrowser url="rapidapi.com/…/api/jsearch">
        <div className="p-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink/70">
            Header Parameters
          </p>
          <div className="mt-2 space-y-1.5 rounded-lg border-2 border-ink bg-paper p-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-ink/45">
              <span className="shrink-0">X-RapidAPI-Host:</span>
              <span className="truncate">jsearch.p.rapidapi.com</span>
            </div>
            <div className="flex items-center gap-2 rounded border-2 border-ink bg-white p-1">
              <span className="shrink-0 text-ink/70">X-RapidAPI-Key:</span>
              <span className="min-w-0 flex-1 truncate text-ink/70">
                ••••••••••••••••••••
              </span>
              <span className="inline-flex shrink-0 items-center rounded-md border-2 border-ink bg-pop-green px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                Copy
              </span>
            </div>
          </div>
          <CopyCallout>☝ this is your key</CopyCallout>
        </div>
      </FauxBrowser>
    </GuideShell>
  );
}
