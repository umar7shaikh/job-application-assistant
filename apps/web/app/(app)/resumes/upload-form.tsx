"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { uploadResume, type UploadState } from "@/app/actions/resumes";
import { SubmitButton } from "@/components/ui/submit-button";

type Mode = "paste" | "upload";

export function UploadForm({ hasAi }: { hasAi: boolean }) {
  const [state, action] = useActionState<UploadState, FormData>(
    uploadResume,
    undefined
  );
  const [mode, setMode] = useState<Mode>("paste");
  const [fileName, setFileName] = useState<string>("");

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        mode === m
          ? "bg-accent-soft text-accent-strong"
          : "text-ink-soft hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form action={action} className="rounded-xl border border-line bg-surface p-6">
      <div className="mb-4 flex gap-1">
        {tab("paste", "Paste code")}
        {tab("upload", "Upload file")}
      </div>

      {!hasAi ? (
        <p className="mb-4 rounded-md border border-line-strong bg-canvas px-3 py-2.5 text-sm text-ink-soft">
          Parsing uses your AI key.{" "}
          <Link href="/settings" className="font-medium text-accent hover:underline">
            Connect one in Settings →
          </Link>
        </p>
      ) : null}

      {state?.error ? (
        <p className="mb-4 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      {mode === "paste" ? (
        <div>
          <textarea
            name="pastedText"
            rows={12}
            placeholder="Paste your résumé here — LaTeX source works great (or plain text)…"
            className="w-full rounded-lg border border-line-strong bg-canvas px-3 py-2.5 font-mono text-xs leading-relaxed text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            LaTeX parses most accurately since the structure is preserved.
          </p>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-canvas px-6 py-10 text-center transition-colors hover:border-accent">
          <span className="font-serif text-lg text-ink">
            {fileName || "Drop your resume, or browse"}
          </span>
          <span className="mt-1 text-xs text-ink-faint">
            PDF, DOCX, TXT, or LaTeX (.tex)
          </span>
          <input
            type="file"
            name="file"
            accept=".pdf,.docx,.txt,.tex,.md"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          />
        </label>
      )}

      <div className="mt-4 flex justify-end">
        <SubmitButton pendingLabel="Parsing your resume…">
          {mode === "paste" ? "Parse pasted resume" : "Upload & parse"}
        </SubmitButton>
      </div>
    </form>
  );
}
