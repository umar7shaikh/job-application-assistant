import { z } from "zod";

/** A scraped job posting, normalized across sources (Apify actors, etc.). */
export const jobPostingSchema = z.object({
  source: z.string(), // "linkedin" | "indeed" | "naukri" | ...
  sourceJobId: z.string(), // stable id from the source, used for dedupe
  title: z.string(),
  company: z.string(),
  location: z.string().default(""),
  url: z.string(),
  remote: z.boolean().default(false),
  jdText: z.string().default(""), // full job description text
  salary: z.string().default(""),
  postedAt: z.string().default(""),
});
export type JobPosting = z.infer<typeof jobPostingSchema>;

/** LLM analysis of a job description. */
export const jdAnalysisSchema = z.object({
  hardSkills: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  yearsExperience: z.string().default(""),
  seniority: z.string().default(""),
});
export type JdAnalysis = z.infer<typeof jdAnalysisSchema>;

/** LLM fit assessment of a profile against a job. */
export const fitAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  summary: z.string().default(""),
});
export type FitAnalysis = z.infer<typeof fitAnalysisSchema>;

export const applicationStatus = [
  "queued",
  "applied",
  "skipped",
  "interviewing",
  "rejected",
  "offer",
] as const;
export type ApplicationStatus = (typeof applicationStatus)[number];
