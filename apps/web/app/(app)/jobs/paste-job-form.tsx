"use client";

import { useActionState } from "react";
import { addManualJob, type AddJobState } from "@/app/actions/jobs";
import { TextField } from "@/components/ui/text-field";
import { SubmitButton } from "@/components/ui/submit-button";

const inputCls =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";

export function PasteJobForm() {
  const [state, action] = useActionState<AddJobState, FormData>(
    addManualJob,
    undefined
  );

  return (
    <form action={action} className="rounded-xl border border-line bg-surface p-6">
      <p className="mb-4 text-sm text-ink-soft">
        No scraper needed — paste a job description from anywhere and we&rsquo;ll
        save it so you can score fit and tailor against it.
      </p>

      <div className="grid gap-4">
        <TextField label="Job title" name="title" placeholder="Frontend Engineer" />
        <TextField label="Company" name="company" placeholder="Acme Inc." />
        <TextField
          label="Location"
          name="location"
          placeholder="Remote, Bangalore… (optional)"
        />
        <TextField
          label="Link"
          name="url"
          placeholder="https://… (optional)"
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Job description
          </span>
          <textarea
            name="jdText"
            rows={10}
            placeholder="Paste the full job description here…"
            className={inputCls}
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm" aria-live="polite">
          {state?.error ? (
            <span className="text-danger">{state.error}</span>
          ) : (
            <span className="text-ink-faint">Title and description are enough.</span>
          )}
        </span>
        <SubmitButton pendingLabel="Saving…">Add job</SubmitButton>
      </div>
    </form>
  );
}
