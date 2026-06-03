import { GuideShell, FauxBrowser, CopyCallout } from "./guide-bits";

/** On-brand visual guide for grabbing an Apify API token. */
export function ApifyGuide() {
  return (
    <GuideShell
      summary="Show me how to get my token"
      steps={[
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
          body: (
            <>
              Paste it into the box above and hit <b>Save keys</b>. Done!
            </>
          ),
        },
      ]}
    >
      <FauxBrowser url="console.apify.com/settings/integrations">
        <div className="flex">
          <div className="hidden w-28 shrink-0 space-y-1 border-r-2 border-ink/15 p-2 text-[11px] font-semibold text-ink/45 sm:block">
            <p>Account</p>
            <p>Profile</p>
            <p className="rounded border-2 border-ink bg-pop-yellow px-1.5 py-0.5 font-extrabold text-ink">
              Integrations
            </p>
            <p>Billing</p>
          </div>
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
            <CopyCallout>☝ copy this, paste above</CopyCallout>
          </div>
        </div>
      </FauxBrowser>
    </GuideShell>
  );
}
