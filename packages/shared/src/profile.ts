import { z } from "zod";

/**
 * The "master profile" is the structured representation of a user's resume.
 * Resume upload parses INTO this; tailoring reads FROM it; the browser
 * extension uses it to autofill application forms. It is the single source
 * of truth for everything the user knows about themselves.
 */

export const contactSchema = z.object({
  fullName: z.string().default(""),
  // Professional title shown under the name, e.g. "Senior Frontend Engineer".
  headline: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
  website: z.string().default(""),
});

export const experienceSchema = z.object({
  company: z.string().default(""),
  title: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""), // free text e.g. "Jan 2022"
  endDate: z.string().default(""), // "" or "Present"
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  institution: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  gpa: z.string().default(""),
  details: z.array(z.string()).default([]),
});

export const projectSchema = z.object({
  name: z.string().default(""),
  description: z.string().default(""),
  url: z.string().default(""),
  bullets: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});

export const skillGroupSchema = z.object({
  category: z.string().default(""), // e.g. "Languages", "Frameworks"
  skills: z.array(z.string()).default([]),
});

/**
 * A catch-all for resume sections that don't map to a structured field above
 * (e.g. "Achievements", "Patents", "Highlights", "Volunteering"). Resumes
 * invent arbitrary headings; rather than drop that content, we keep it
 * verbatim under its original title so nothing is lost on import.
 */
export const customSectionSchema = z.object({
  title: z.string().default(""), // the heading as written, e.g. "Achievements"
  items: z.array(z.string()).default([]), // lines/bullets under it
});

export const resumeTemplates = ["classic", "sidebar"] as const;
export const resumeAccents = [
  "green",
  "blue",
  "slate",
  "plum",
  "burgundy",
] as const;
export type ResumeTemplate = (typeof resumeTemplates)[number];
export type ResumeAccent = (typeof resumeAccents)[number];

/** Rendering preferences for the generated PDF/LaTeX (not resume content). */
export const layoutPrefsSchema = z.object({
  // Max pages to fit within. 0 = auto (natural flow, no scaling).
  pageTarget: z.number().int().min(0).max(4).default(0),
  // Visual layout of the generated resume.
  template: z.enum(resumeTemplates).default("classic"),
  // Accent color used for headings, rules, and bullets.
  accent: z.enum(resumeAccents).default("green"),
  // Whether to include the Summary section in the rendered resume. The text is
  // still kept on the profile when off — this just hides it from the output.
  showSummary: z.boolean().default(true),
});

export const masterProfileSchema = z.object({
  contact: contactSchema.default({}),
  summary: z.string().default(""),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  // Free-form extra answers the user wants available for autofill,
  // e.g. "Are you authorized to work in the US?" -> "Yes"
  customAnswers: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([]),
  // Anything that didn't fit the fields above, preserved under its heading.
  customSections: z.array(customSectionSchema).default([]),
  // How to render the PDF (page fit, etc.) — not part of the resume content.
  layout: layoutPrefsSchema.default({}),
});

export type Contact = z.infer<typeof contactSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type CustomSection = z.infer<typeof customSectionSchema>;
export type LayoutPrefs = z.infer<typeof layoutPrefsSchema>;
export type MasterProfile = z.infer<typeof masterProfileSchema>;

/** An empty, valid profile (useful for new users / form defaults). */
export const emptyProfile = (): MasterProfile => masterProfileSchema.parse({});
