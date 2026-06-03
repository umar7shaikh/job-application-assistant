import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import type { AiProviderId } from "@builder/shared";
import { db, userSecrets } from "@builder/db";
import { requireUser } from "@/lib/dal";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings · Lever" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [secrets] = await db
    .select()
    .from(userSecrets)
    .where(eq(userSecrets.userId, user.id))
    .limit(1);

  return (
    <div className="max-w-2xl">
      <span className="c-chip bg-pop-yellow text-ink">Settings</span>
      <h1 className="mt-3 font-comic text-5xl tracking-wide text-ink">
        API keys
      </h1>
      <p className="mt-3 font-medium text-ink/75">
        Lever uses your own keys so you stay in control of usage and cost. Keys
        are encrypted at rest and never shown again after saving.
      </p>

      <div className="mt-8">
        {/* Only booleans + provider cross the boundary — never the keys themselves. */}
        <SettingsForm
          apifyConnected={Boolean(secrets?.apifyKeyEnc)}
          rapidapiConnected={Boolean(secrets?.rapidapiKeyEnc)}
          aiConnected={Boolean(secrets?.aiKeyEnc)}
          aiProvider={(secrets?.aiProvider as AiProviderId) ?? ""}
        />
      </div>
    </div>
  );
}
