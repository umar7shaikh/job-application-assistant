"use client";

import { useActionState } from "react";
import { scoreJob, type ScoreState } from "@/app/actions/analysis";
import { SubmitButton } from "@/components/ui/submit-button";

export function ScoreButton({
  jobId,
  label,
}: {
  jobId: string;
  label: string;
}) {
  const [state, action] = useActionState<ScoreState, FormData>(
    scoreJob,
    undefined
  );
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="jobId" value={jobId} />
      <SubmitButton pendingLabel="Scoring…">{label}</SubmitButton>
      {state?.error ? (
        <span className="text-sm text-danger">{state.error}</span>
      ) : null}
    </form>
  );
}
