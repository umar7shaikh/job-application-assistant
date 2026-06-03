import "server-only";
import {
  jdAnalysisSchema,
  fitAnalysisSchema,
  type JdAnalysis,
  type FitAnalysis,
  type MasterProfile,
} from "@builder/shared";
import { completeJson, AiError, type AiCreds } from "./ai";

/** Compact, token-efficient text view of a profile for the LLM. */
export function profileSummary(p: MasterProfile): string {
  const skills = p.skills.flatMap((g) => g.skills).join(", ");
  const exp = p.experience
    .map(
      (e) =>
        `- ${e.title} @ ${e.company} (${e.startDate}–${
          e.current ? "Present" : e.endDate
        }): ${e.bullets.slice(0, 3).join("; ")}`
    )
    .join("\n");
  const edu = p.education
    .map((e) => `${e.degree} ${e.field} — ${e.institution}`)
    .join("; ");
  return [
    p.contact.fullName && `Name: ${p.contact.fullName}`,
    p.summary && `Summary: ${p.summary}`,
    skills && `Skills: ${skills}`,
    exp && `Experience:\n${exp}`,
    edu && `Education: ${edu}`,
    p.certifications.length > 0 &&
      `Certifications: ${p.certifications.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000);
}

const SYSTEM = `You are a precise technical recruiter. Given a JOB DESCRIPTION and a CANDIDATE PROFILE, return ONLY this JSON:
{
  "analysis": {
    "hardSkills": [], "softSkills": [], "keywords": [],
    "responsibilities": [], "requirements": [],
    "yearsExperience": "", "seniority": ""
  },
  "fit": {
    "score": 0, "matchedSkills": [], "missingSkills": [],
    "strengths": [], "gaps": [], "summary": ""
  }
}
Rules:
- "analysis" describes the JOB only (extract required skills, keywords, responsibilities, required years like "3-5 years", seniority like "Senior").
- "fit.score" is an integer 0-100 measuring how well THIS candidate matches THIS job.
- Weigh: skills overlap, years-of-experience vs required, seniority match, domain relevance. Be honest — a fresher applying to a senior role should score low; a strong match should score high.
- "matchedSkills" = candidate skills the job wants; "missingSkills" = job requirements the candidate lacks.
- "summary" = one or two sentences on the fit. Keep every array to ~10 items max.`;

export type JobFit = { analysis: JdAnalysis; fit: FitAnalysis };

/** One LLM call that both analyzes the JD and scores the candidate's fit. */
export async function analyzeAndScore(
  jdText: string,
  profile: MasterProfile,
  creds: AiCreds
): Promise<JobFit> {
  if (!jdText || jdText.trim().length < 30) {
    throw new AiError("This job has no description text to analyze.");
  }

  const raw = await completeJson<{ analysis?: unknown; fit?: unknown }>(creds, {
    system: SYSTEM,
    prompt: `JOB DESCRIPTION:\n${jdText.slice(0, 16000)}\n\nCANDIDATE PROFILE:\n${profileSummary(
      profile
    )}`,
    maxTokens: 2048,
    temperature: 0,
  });

  const analysis = jdAnalysisSchema.safeParse(raw.analysis);
  const fit = fitAnalysisSchema.safeParse({
    ...(typeof raw.fit === "object" && raw.fit ? raw.fit : {}),
    // Coerce score into range in case the model returns a float/string.
    score: clampScore((raw.fit as { score?: unknown })?.score),
  });

  if (!analysis.success || !fit.success) {
    throw new AiError("The model's analysis output was malformed. Try again.");
  }
  return { analysis: analysis.data, fit: fit.data };
}

function clampScore(v: unknown): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
