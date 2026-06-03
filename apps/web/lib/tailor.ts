import "server-only";
import { masterProfileSchema, type MasterProfile } from "@builder/shared";
import { complete, completeJson, AiError, type AiCreds } from "./ai";
import { profileSummary } from "./analysis";

export type JobContext = { title: string; company: string; jdText: string };

/**
 * How aggressively to align the resume's Skills with the job:
 *  - "honest": only surface skills already evidenced in the resume (defensible).
 *  - "aggressive": add all required skills for max ATS keyword coverage.
 */
export type TailorMode = "honest" | "aggressive";

const SKILLS_RULE: Record<TailorMode, string> = {
  honest: `- Reorder "skills" so the job's required skills come first. You MAY ADD a required skill ONLY IF it is already evidenced elsewhere in the candidate's experience, projects, or other sections (e.g. a bullet mentions "FastAPI" but it's missing from skills — add it). Mirror the job's exact wording for skills the candidate already has (e.g. "JS" -> "JavaScript"). Do NOT add any skill that has no evidence in the resume.`,
  aggressive: `- Reorder "skills" so the job's required skills come first, AND add the job's required/preferred skills even if not yet present, grouped under sensible categories, to maximize keyword coverage. (Still never fabricate employers, titles, dates, metrics, or experience bullets — only the skills list may include required keywords.)`,
};

function tailorSystem(mode: TailorMode): string {
  return `You tailor a candidate's resume to a specific job.
Return ONLY a JSON object with the SAME shape as the input profile:
{ "contact": {...}, "summary": "", "experience": [], "education": [], "projects": [], "skills": [], "certifications": [], "languages": [], "customAnswers": [], "customSections": [] }
Tailoring rules:
- Rewrite "summary" to target THIS role (truthful, concise, 2–3 sentences).
- Reorder experience bullets so the most relevant-to-this-job appear first; you may rephrase for impact and to mirror the job's keywords, but NEVER fabricate responsibilities, employers, titles, dates, or metrics.
- Reorder "projects" so the most relevant to this job appear first; you may rephrase project bullets to mirror the job's keywords, but do NOT fabricate.
${SKILLS_RULE[mode]}
- Keep contact, employers, titles, dates, education, and customSections exactly as given (pass customSections through unchanged).`;
}

export async function tailorResume(
  profile: MasterProfile,
  job: JobContext,
  creds: AiCreds,
  mode: TailorMode = "honest"
): Promise<MasterProfile> {
  const json = await completeJson<unknown>(creds, {
    system: tailorSystem(mode),
    prompt: `TARGET JOB: ${job.title} at ${job.company}\n\nJOB DESCRIPTION:\n${job.jdText.slice(
      0,
      12000
    )}\n\nCURRENT PROFILE (JSON):\n${JSON.stringify(profile)}`,
    maxTokens: 8192,
    temperature: 0.3,
  });
  const parsed = masterProfileSchema.safeParse(json);
  if (!parsed.success) {
    throw new AiError("Couldn't generate a valid tailored resume. Try again.");
  }
  return parsed.data;
}

const COVER_SYSTEM = `You write concise, specific cover letters in first person.
3 short paragraphs, ~180–220 words. Use the REAL company name and role — never placeholders like [Company].
Professional and warm, not generic. Reference 1–2 concrete strengths that match the job.
Return ONLY the letter body text, ending with "Best regards,\\n<candidate name>". No date or address block.`;

export async function writeCoverLetter(
  profile: MasterProfile,
  job: JobContext,
  creds: AiCreds
): Promise<string> {
  const text = await complete(creds, {
    system: COVER_SYSTEM,
    prompt: `Candidate:\n${profileSummary(profile)}\n\nApplying for: ${job.title} at ${job.company}\n\nJob description:\n${job.jdText.slice(
      0,
      8000
    )}`,
    maxTokens: 800,
    temperature: 0.5,
  });
  return text.trim();
}
