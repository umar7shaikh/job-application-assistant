"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { LayoutPrefs, MasterProfile } from "@builder/shared";
import { saveProfile, type SaveProfileState } from "@/app/actions/resumes";
import { SubmitButton } from "@/components/ui/submit-button";

const inputCls = "c-field";
const labelCls = "c-label";

function updateAt<T>(arr: T[], i: number, patch: Partial<T>): T[] {
  return arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
}
function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

/** Trim strings and drop blank list entries before persisting. */
function cleanProfile(p: MasterProfile, layout: LayoutPrefs): MasterProfile {
  const lines = (a: string[]) => a.map((s) => s.trim()).filter(Boolean);
  return {
    layout,
    contact: p.contact,
    summary: p.summary.trim(),
    experience: p.experience.map((e) => ({ ...e, bullets: lines(e.bullets) })),
    education: p.education.map((e) => ({ ...e, details: lines(e.details) })),
    projects: p.projects.map((pr) => ({
      ...pr,
      bullets: lines(pr.bullets),
      technologies: lines(pr.technologies),
    })),
    skills: p.skills
      .map((g) => ({ category: g.category.trim(), skills: lines(g.skills) }))
      .filter((g) => g.category || g.skills.length),
    certifications: lines(p.certifications),
    languages: lines(p.languages),
    customAnswers: p.customAnswers.filter(
      (q) => q.question.trim() || q.answer.trim()
    ),
    customSections: p.customSections
      .map((s) => ({ title: s.title.trim(), items: lines(s.items) }))
      .filter((s) => s.title || s.items.length),
  };
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="c-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-comic text-2xl tracking-wide text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-medium text-accent hover:underline"
    >
      + {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-ink-faint hover:text-danger"
    >
      Remove
    </button>
  );
}

export function ProfileEditor({
  id,
  name: initialName,
  data,
  layout,
  showSummary,
  onShowSummaryChange,
  onSaved,
}: {
  id: string;
  name: string;
  data: MasterProfile;
  /** Layout preferences (page-fit, template, accent) to persist with the resume. */
  layout: LayoutPrefs;
  /** Whether the summary is included in the rendered resume. */
  showSummary: boolean;
  onShowSummaryChange: (v: boolean) => void;
  /** Called after a successful save (e.g. to refresh a preview). */
  onSaved?: () => void;
}) {
  const [state, action] = useActionState<SaveProfileState, FormData>(
    saveProfile,
    undefined
  );
  const [name, setName] = useState(initialName);
  const [p, setP] = useState<MasterProfile>(data);

  const serialized = useMemo(
    () => JSON.stringify(cleanProfile(p, layout)),
    [p, layout]
  );

  useEffect(() => {
    if (state?.ok) onSaved?.();
  }, [state, onSaved]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="data" value={serialized} />

      {/* Name + save bar */}
      <div className="c-card flex items-end gap-4 p-6">
        <div className="flex-1">
          <label className={labelCls}>Resume name</label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" aria-live="polite">
            {state?.ok ? (
              <span className="text-accent">Saved.</span>
            ) : state?.error ? (
              <span className="text-danger">{state.error}</span>
            ) : null}
          </span>
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
        </div>
      </div>

      {/* Contact */}
      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["fullName", "Full name"],
              ["headline", "Headline / title"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["location", "Location"],
              ["linkedin", "LinkedIn"],
              ["github", "GitHub"],
              ["website", "Website"],
            ] as const
          ).map(([field, label]) => (
            <div key={field}>
              <label className={labelCls}>{label}</label>
              <input
                value={p.contact[field]}
                onChange={(e) =>
                  setP((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, [field]: e.target.value },
                  }))
                }
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Summary */}
      <Section
        title="Summary"
        action={
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={showSummary}
              onChange={(e) => onShowSummaryChange(e.target.checked)}
            />
            Include in resume
          </label>
        }
      >
        <textarea
          rows={3}
          value={p.summary}
          onChange={(e) => setP((prev) => ({ ...prev, summary: e.target.value }))}
          className={`${inputCls} ${showSummary ? "" : "opacity-50"}`}
          placeholder="A short professional summary…"
        />
        {!showSummary ? (
          <p className="mt-1.5 text-xs text-ink-faint">
            Hidden from the resume — the text is kept, just not shown.
          </p>
        ) : null}
      </Section>

      {/* Experience */}
      <Section
        title="Experience"
        action={
          <AddButton
            label="Add role"
            onClick={() =>
              setP((prev) => ({
                ...prev,
                experience: [
                  ...prev.experience,
                  {
                    company: "",
                    title: "",
                    location: "",
                    startDate: "",
                    endDate: "",
                    current: false,
                    bullets: [],
                  },
                ],
              }))
            }
          />
        }
      >
        <div className="space-y-5">
          {p.experience.map((exp, i) => (
            <div key={i} className="rounded-lg border-2 border-ink/15 bg-paper p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-faint">
                  Role {i + 1}
                </span>
                <RemoveButton
                  onClick={() =>
                    setP((prev) => ({
                      ...prev,
                      experience: removeAt(prev.experience, i),
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={inputCls}
                  placeholder="Title"
                  value={exp.title}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      experience: updateAt(prev.experience, i, {
                        title: e.target.value,
                      }),
                    }))
                  }
                />
                <input
                  className={inputCls}
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      experience: updateAt(prev.experience, i, {
                        company: e.target.value,
                      }),
                    }))
                  }
                />
                <input
                  className={inputCls}
                  placeholder="Location"
                  value={exp.location}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      experience: updateAt(prev.experience, i, {
                        location: e.target.value,
                      }),
                    }))
                  }
                />
                <div className="flex items-center gap-2">
                  <input
                    className={inputCls}
                    placeholder="Start (Jan 2022)"
                    value={exp.startDate}
                    onChange={(e) =>
                      setP((prev) => ({
                        ...prev,
                        experience: updateAt(prev.experience, i, {
                          startDate: e.target.value,
                        }),
                      }))
                    }
                  />
                  <input
                    className={inputCls}
                    placeholder="End / Present"
                    value={exp.endDate}
                    onChange={(e) =>
                      setP((prev) => ({
                        ...prev,
                        experience: updateAt(prev.experience, i, {
                          endDate: e.target.value,
                        }),
                      }))
                    }
                  />
                </div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      experience: updateAt(prev.experience, i, {
                        current: e.target.checked,
                      }),
                    }))
                  }
                />
                I currently work here
              </label>
              <div className="mt-3">
                <label className={labelCls}>Bullets (one per line)</label>
                <textarea
                  rows={4}
                  className={inputCls}
                  value={exp.bullets.join("\n")}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      experience: updateAt(prev.experience, i, {
                        bullets: e.target.value.split("\n"),
                      }),
                    }))
                  }
                />
              </div>
            </div>
          ))}
          {p.experience.length === 0 ? (
            <p className="text-sm text-ink-faint">No roles yet.</p>
          ) : null}
        </div>
      </Section>

      {/* Education */}
      <Section
        title="Education"
        action={
          <AddButton
            label="Add education"
            onClick={() =>
              setP((prev) => ({
                ...prev,
                education: [
                  ...prev.education,
                  {
                    institution: "",
                    degree: "",
                    field: "",
                    startDate: "",
                    endDate: "",
                    gpa: "",
                    details: [],
                  },
                ],
              }))
            }
          />
        }
      >
        <div className="space-y-5">
          {p.education.map((ed, i) => (
            <div key={i} className="rounded-lg border-2 border-ink/15 bg-paper p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-faint">
                  Entry {i + 1}
                </span>
                <RemoveButton
                  onClick={() =>
                    setP((prev) => ({
                      ...prev,
                      education: removeAt(prev.education, i),
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={inputCls}
                  placeholder="Institution"
                  value={ed.institution}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      education: updateAt(prev.education, i, {
                        institution: e.target.value,
                      }),
                    }))
                  }
                />
                <input
                  className={inputCls}
                  placeholder="Degree"
                  value={ed.degree}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      education: updateAt(prev.education, i, {
                        degree: e.target.value,
                      }),
                    }))
                  }
                />
                <input
                  className={inputCls}
                  placeholder="Field of study"
                  value={ed.field}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      education: updateAt(prev.education, i, {
                        field: e.target.value,
                      }),
                    }))
                  }
                />
                <input
                  className={inputCls}
                  placeholder="GPA (optional)"
                  value={ed.gpa}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      education: updateAt(prev.education, i, {
                        gpa: e.target.value,
                      }),
                    }))
                  }
                />
              </div>
            </div>
          ))}
          {p.education.length === 0 ? (
            <p className="text-sm text-ink-faint">No education yet.</p>
          ) : null}
        </div>
      </Section>

      {/* Skills */}
      <Section
        title="Skills"
        action={
          <AddButton
            label="Add group"
            onClick={() =>
              setP((prev) => ({
                ...prev,
                skills: [...prev.skills, { category: "", skills: [] }],
              }))
            }
          />
        }
      >
        <div className="space-y-4">
          {p.skills.map((g, i) => (
            <div key={i} className="rounded-lg border-2 border-ink/15 bg-paper p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <input
                  className={inputCls}
                  placeholder="Category (e.g. Languages)"
                  value={g.category}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      skills: updateAt(prev.skills, i, {
                        category: e.target.value,
                      }),
                    }))
                  }
                />
                <RemoveButton
                  onClick={() =>
                    setP((prev) => ({
                      ...prev,
                      skills: removeAt(prev.skills, i),
                    }))
                  }
                />
              </div>
              <label className={labelCls}>Skills (one per line)</label>
              <textarea
                rows={3}
                className={inputCls}
                value={g.skills.join("\n")}
                onChange={(e) =>
                  setP((prev) => ({
                    ...prev,
                    skills: updateAt(prev.skills, i, {
                      skills: e.target.value.split("\n"),
                    }),
                  }))
                }
              />
            </div>
          ))}
          {p.skills.length === 0 ? (
            <p className="text-sm text-ink-faint">No skills yet.</p>
          ) : null}
        </div>
      </Section>

      {/* Projects */}
      <Section
        title="Projects"
        action={
          <AddButton
            label="Add project"
            onClick={() =>
              setP((prev) => ({
                ...prev,
                projects: [
                  ...prev.projects,
                  {
                    name: "",
                    description: "",
                    url: "",
                    bullets: [],
                    technologies: [],
                  },
                ],
              }))
            }
          />
        }
      >
        <div className="space-y-5">
          {p.projects.map((pr, i) => (
            <div key={i} className="rounded-lg border-2 border-ink/15 bg-paper p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <input
                  className={inputCls}
                  placeholder="Project name"
                  value={pr.name}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      projects: updateAt(prev.projects, i, {
                        name: e.target.value,
                      }),
                    }))
                  }
                />
                <RemoveButton
                  onClick={() =>
                    setP((prev) => ({
                      ...prev,
                      projects: removeAt(prev.projects, i),
                    }))
                  }
                />
              </div>
              <input
                className={`${inputCls} mb-3`}
                placeholder="URL (optional)"
                value={pr.url}
                onChange={(e) =>
                  setP((prev) => ({
                    ...prev,
                    projects: updateAt(prev.projects, i, {
                      url: e.target.value,
                    }),
                  }))
                }
              />
              <label className={labelCls}>Technologies (one per line)</label>
              <textarea
                rows={2}
                className={`${inputCls} mb-3`}
                value={pr.technologies.join("\n")}
                onChange={(e) =>
                  setP((prev) => ({
                    ...prev,
                    projects: updateAt(prev.projects, i, {
                      technologies: e.target.value.split("\n"),
                    }),
                  }))
                }
              />
              <label className={labelCls}>Bullets (one per line)</label>
              <textarea
                rows={3}
                className={inputCls}
                value={pr.bullets.join("\n")}
                onChange={(e) =>
                  setP((prev) => ({
                    ...prev,
                    projects: updateAt(prev.projects, i, {
                      bullets: e.target.value.split("\n"),
                    }),
                  }))
                }
              />
            </div>
          ))}
          {p.projects.length === 0 ? (
            <p className="text-sm text-ink-faint">No projects yet.</p>
          ) : null}
        </div>
      </Section>

      {/* Certifications & Languages */}
      <Section title="Certifications & languages">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Certifications (one per line)</label>
            <textarea
              rows={3}
              className={inputCls}
              value={p.certifications.join("\n")}
              onChange={(e) =>
                setP((prev) => ({
                  ...prev,
                  certifications: e.target.value.split("\n"),
                }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Languages (one per line)</label>
            <textarea
              rows={3}
              className={inputCls}
              value={p.languages.join("\n")}
              onChange={(e) =>
                setP((prev) => ({
                  ...prev,
                  languages: e.target.value.split("\n"),
                }))
              }
            />
          </div>
        </div>
      </Section>

      {/* Other sections — anything the resume had that didn't fit above */}
      <Section
        title="Other sections"
        action={
          <AddButton
            label="Add section"
            onClick={() =>
              setP((prev) => ({
                ...prev,
                customSections: [
                  ...prev.customSections,
                  { title: "", items: [] },
                ],
              }))
            }
          />
        }
      >
        <p className="mb-4 text-sm text-ink-soft">
          Anything from your resume that doesn&rsquo;t fit the sections above —
          awards, patents, highlights, volunteering, and so on. Kept exactly as
          written so nothing is lost.
        </p>
        <div className="space-y-5">
          {p.customSections.map((s, i) => (
            <div key={i} className="rounded-lg border-2 border-ink/15 bg-paper p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <input
                  className={inputCls}
                  placeholder="Section title (e.g. Achievements)"
                  value={s.title}
                  onChange={(e) =>
                    setP((prev) => ({
                      ...prev,
                      customSections: updateAt(prev.customSections, i, {
                        title: e.target.value,
                      }),
                    }))
                  }
                />
                <RemoveButton
                  onClick={() =>
                    setP((prev) => ({
                      ...prev,
                      customSections: removeAt(prev.customSections, i),
                    }))
                  }
                />
              </div>
              <label className={labelCls}>Lines (one per line)</label>
              <textarea
                rows={4}
                className={inputCls}
                value={s.items.join("\n")}
                onChange={(e) =>
                  setP((prev) => ({
                    ...prev,
                    customSections: updateAt(prev.customSections, i, {
                      items: e.target.value.split("\n"),
                    }),
                  }))
                }
              />
            </div>
          ))}
          {p.customSections.length === 0 ? (
            <p className="text-sm text-ink-faint">No other sections.</p>
          ) : null}
        </div>
      </Section>

      {/* Custom answers (for autofill later) */}
      <Section
        title="Saved answers"
        action={
          <AddButton
            label="Add answer"
            onClick={() =>
              setP((prev) => ({
                ...prev,
                customAnswers: [
                  ...prev.customAnswers,
                  { question: "", answer: "" },
                ],
              }))
            }
          />
        }
      >
        <p className="mb-4 text-sm text-ink-soft">
          Reusable answers to common application questions (e.g. work
          authorization). The autofill extension will use these.
        </p>
        <div className="space-y-3">
          {p.customAnswers.map((qa, i) => (
            <div key={i} className="flex items-start gap-3">
              <input
                className={inputCls}
                placeholder="Question"
                value={qa.question}
                onChange={(e) =>
                  setP((prev) => ({
                    ...prev,
                    customAnswers: updateAt(prev.customAnswers, i, {
                      question: e.target.value,
                    }),
                  }))
                }
              />
              <input
                className={inputCls}
                placeholder="Answer"
                value={qa.answer}
                onChange={(e) =>
                  setP((prev) => ({
                    ...prev,
                    customAnswers: updateAt(prev.customAnswers, i, {
                      answer: e.target.value,
                    }),
                  }))
                }
              />
              <button
                type="button"
                onClick={() =>
                  setP((prev) => ({
                    ...prev,
                    customAnswers: removeAt(prev.customAnswers, i),
                  }))
                }
                className="pt-2 text-xs text-ink-faint hover:text-danger"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end pb-4">
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}
