"use client";

import { useActionState } from "react";
import { trackApplication, type TrackState } from "@/app/actions/applications";
import { SubmitButton } from "@/components/ui/submit-button";

export function TrackButton({ jobId }: { jobId: string }) {
  const [state, action] = useActionState<TrackState, FormData>(
    trackApplication,
    undefined
  );
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="jobId" value={jobId} />
      <SubmitButton pendingLabel="Adding…">Track application</SubmitButton>
      {state?.error ? (
        <span className="text-sm text-danger">{state.error}</span>
      ) : null}
    </form>
  );
}
