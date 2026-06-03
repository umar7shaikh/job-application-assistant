import type { FitAnalysis, JdAnalysis } from "@builder/shared";

export function scoreTone(score: number): { text: string; bg: string; label: string } {
  if (score >= 70) return { text: "text-accent-strong", bg: "bg-accent-soft", label: "Strong match" };
  if (score >= 45) return { text: "text-ink", bg: "bg-canvas", label: "Possible match" };
  return { text: "text-danger", bg: "bg-danger-soft", label: "Weak match" };
}

export function ScoreChip({ score }: { score: number }) {
  const tone = scoreTone(score);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${tone.bg} px-2.5 py-1 text-xs font-medium ${tone.text} tnum`}
    >
      {score}
      <span className="opacity-60">fit</span>
    </span>
  );
}

function Chips({
  items,
  tone = "neutral",
}: {
  items: string[];
  tone?: "match" | "miss" | "neutral";
}) {
  if (!items.length) return <span className="text-sm text-ink-faint">—</span>;
  const cls =
    tone === "match"
      ? "bg-accent-soft text-accent-strong"
      : tone === "miss"
        ? "bg-danger-soft text-danger"
        : "bg-canvas text-ink-soft";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => (
        <span key={i} className={`rounded-full px-2.5 py-1 text-xs ${cls}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-ink-faint">—</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((s, i) => (
        <li key={i} className="text-sm leading-relaxed text-ink-soft">
          • {s}
        </li>
      ))}
    </ul>
  );
}

export function FitCard({
  fit,
  analysis,
}: {
  fit: FitAnalysis;
  analysis?: JdAnalysis | null;
}) {
  const tone = scoreTone(fit.score);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5 rounded-xl border border-line bg-surface p-6">
        <div className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full ${tone.bg}`}>
          <span className={`font-serif text-3xl ${tone.text} tnum`}>{fit.score}</span>
          <span className="text-[10px] text-ink-faint">/ 100</span>
        </div>
        <div>
          <p className={`text-sm font-medium ${tone.text}`}>{tone.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {fit.summary || "No summary."}
          </p>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
        <div className="bg-surface p-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Matched skills
          </h3>
          <Chips items={fit.matchedSkills} tone="match" />
        </div>
        <div className="bg-surface p-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Missing / to address
          </h3>
          <Chips items={fit.missingSkills} tone="miss" />
        </div>
        <div className="bg-surface p-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Your strengths here
          </h3>
          <List items={fit.strengths} />
        </div>
        <div className="bg-surface p-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Gaps to close
          </h3>
          <List items={fit.gaps} />
        </div>
      </div>

      {analysis ? (
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
            What the job asks for
          </h3>
          <div className="space-y-3 text-sm text-ink-soft">
            {(analysis.yearsExperience || analysis.seniority) && (
              <p>
                <span className="text-ink-faint">Experience: </span>
                {[analysis.seniority, analysis.yearsExperience]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            )}
            <div>
              <span className="text-ink-faint">Key skills: </span>
              <span className="mt-1 inline-block align-top">
                <Chips items={analysis.hardSkills} />
              </span>
            </div>
            {analysis.requirements.length > 0 && (
              <div>
                <span className="text-ink-faint">Requirements:</span>
                <List items={analysis.requirements} />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
