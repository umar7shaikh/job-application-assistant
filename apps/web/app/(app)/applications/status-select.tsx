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
        className="rounded-lg border-2 border-ink bg-white px-2.5 py-1.5 text-xs font-bold text-ink capitalize focus:outline-none focus:ring-[3px] focus:ring-pop-yellow"
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
