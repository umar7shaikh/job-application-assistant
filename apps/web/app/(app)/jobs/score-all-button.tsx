"use client";

import { useActionState } from "react";
import { scoreAllJobs, type ScoreAllState } from "@/app/actions/analysis";
import { SubmitButton } from "@/components/ui/submit-button";

export function ScoreAllButton() {
  const [state, action] = useActionState<ScoreAllState, FormData>(
    scoreAllJobs,
    undefined
  );

  const summary =
    state && !state.error
      ? [
          `Scored ${state.scored ?? 0}`,
          state.skippedNoJd ? `${state.skippedNoJd} had no description` : "",
          state.failed ? `${state.failed} failed` : "",
          state.remaining ? `${state.remaining} left — click again` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "";

  return (
    <form action={action} className="flex items-center gap-3">
      <SubmitButton pendingLabel="Scoring…">Score all</SubmitButton>
      {state?.error ? (
        <span className="text-sm text-danger">{state.error}</span>
      ) : summary ? (
        <span className="text-sm text-ink-soft">{summary}</span>
      ) : null}
    </form>
  );
}
