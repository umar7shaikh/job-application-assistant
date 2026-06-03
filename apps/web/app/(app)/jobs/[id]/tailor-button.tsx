"use client";

import { useActionState, useState } from "react";
import { generateTailored, type TailorState } from "@/app/actions/tailor";
import { SubmitButton } from "@/components/ui/submit-button";

type Mode = "honest" | "aggressive";

const MODES: { value: Mode; label: string; hint: string }[] = [
  {
    value: "honest",
    label: "Honest",
    hint: "Only surfaces skills you already show in your resume. Fully defensible in an interview.",
  },
  {
    value: "aggressive",
    label: "Max keywords",
    hint: "Adds every skill the job asks for to maximize ATS matches — be ready to back them up.",
  },
];

export function TailorButton({
  jobId,
  label,
  compact = false,
}: {
  jobId: string;
  label: string;
  /** Compact = inline toggle + button, no description (for the Regenerate row). */
  compact?: boolean;
}) {
  const [state, action] = useActionState<TailorState, FormData>(
    generateTailored,
    undefined
  );
  const [mode, setMode] = useState<Mode>("honest");
  const hint = MODES.find((m) => m.value === mode)!.hint;

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="mode" value={mode} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-md border border-line-strong">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                mode === m.value
                  ? "bg-accent text-white"
                  : "bg-surface text-ink-soft hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <SubmitButton pendingLabel="Tailoring… (takes ~20s)">
          {label}
        </SubmitButton>
        {state?.error ? (
          <span className="text-sm text-danger">{state.error}</span>
        ) : null}
      </div>

      {!compact ? <p className="text-xs text-ink-faint">{hint}</p> : null}
    </form>
  );
}
