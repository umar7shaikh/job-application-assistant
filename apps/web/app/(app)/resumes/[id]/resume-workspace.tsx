"use client";

import { useCallback, useState } from "react";
import type {
  LayoutPrefs,
  MasterProfile,
  ResumeAccent,
  ResumeTemplate,
} from "@builder/shared";
import { ProfileEditor } from "./profile-editor";

/**
 * Side-by-side resume editing: the structured editor on the left, and an exact
 * preview of the generated PDF on the right. The preview reflects the last
 * SAVED content, plus any layout tweaks (page-fit, template, accent) which
 * preview instantly via query params and persist on Save.
 */

const PAGE_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Auto" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
];

const TEMPLATES: { value: ResumeTemplate; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "sidebar", label: "Two-column" },
];

const ACCENTS: { value: ResumeAccent; color: string }[] = [
  { value: "green", color: "#0E6E55" },
  { value: "blue", color: "#1D4ED8" },
  { value: "slate", color: "#334155" },
  { value: "plum", color: "#6D28D9" },
  { value: "burgundy", color: "#9F1239" },
];

export function ResumeWorkspace({
  id,
  name,
  data,
}: {
  id: string;
  name: string;
  data: MasterProfile;
}) {
  // Bumped on each save to bust the iframe/PDF cache and force a reload.
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const [layout, setLayout] = useState<LayoutPrefs>(data.layout);
  const set = <K extends keyof LayoutPrefs>(key: K, value: LayoutPrefs[K]) =>
    setLayout((l) => ({ ...l, [key]: value }));

  const src =
    `/api/resumes/${id}/pdf?pages=${layout.pageTarget}` +
    `&template=${layout.template}&accent=${layout.accent}` +
    `&summary=${layout.showSummary ? 1 : 0}&v=${version}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:items-start">
      <ProfileEditor
        id={id}
        name={name}
        data={data}
        layout={layout}
        showSummary={layout.showSummary}
        onShowSummaryChange={(v) => set("showSummary", v)}
        onSaved={refresh}
      />

      <div className="lg:sticky lg:top-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-soft">Preview</h2>
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={refresh}
              className="text-ink-soft hover:text-ink"
            >
              ↻ Refresh
            </button>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent hover:underline"
            >
              Open ↗
            </a>
          </div>
        </div>

        {/* Layout controls */}
        <div className="mb-3 space-y-2 rounded-lg border border-line bg-surface p-3">
          <Control label="Style">
            <Segmented
              options={TEMPLATES.map((t) => ({ value: t.value, label: t.label }))}
              value={layout.template}
              onChange={(v) => set("template", v as ResumeTemplate)}
            />
          </Control>
          <Control label="Fit to pages">
            <Segmented
              options={PAGE_OPTIONS.map((o) => ({
                value: String(o.value),
                label: o.label,
              }))}
              value={String(layout.pageTarget)}
              onChange={(v) => set("pageTarget", Number(v))}
            />
          </Control>
          <Control label="Accent">
            <div className="flex items-center gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  aria-label={a.value}
                  onClick={() => set("accent", a.value)}
                  className={`h-5 w-5 rounded-full border-2 transition-transform ${
                    layout.accent === a.value
                      ? "scale-110 border-ink"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: a.color }}
                />
              ))}
            </div>
          </Control>
        </div>

        <iframe
          key={`${layout.template}-${layout.accent}-${layout.pageTarget}-${version}`}
          src={src}
          title="Resume preview"
          className="h-[74vh] w-full rounded-xl border border-line bg-surface"
        />
        <p className="mt-2 text-xs text-ink-faint">
          Preview updates instantly. Hit{" "}
          <span className="text-ink-soft">Save</span> to keep these settings for
          downloads &amp; tailored versions.
        </p>
      </div>
    </div>
  );
}

function Control({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-ink-faint">{label}</span>
      {children}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-line-strong">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 text-xs transition-colors ${
            value === o.value
              ? "bg-accent text-white"
              : "bg-surface text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
