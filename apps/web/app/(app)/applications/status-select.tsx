"use client";

import { applicationStatus } from "@builder/shared";
import { updateApplicationStatus } from "@/app/actions/applications";

export function StatusSelect({
  id,
  value,
}: {
  id: string;
  value: string;
}) {
  return (
    <form action={updateApplicationStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-xs text-ink capitalize focus:border-accent focus:outline-none"
      >
        {applicationStatus.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
