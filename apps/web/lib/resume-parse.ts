import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { masterProfileSchema, type MasterProfile } from "@builder/shared";
import { completeJson, type AiCreds, AiError } from "./ai";

/** Extract raw text from an uploaded resume (PDF / DOCX / TXT). */
export async function extractResumeText(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
  }
  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value.trim();
  }
  // Plain-text formats — including LaTeX (.tex) and Markdown, which actually
  // parse MORE accurately than PDFs since the structure is preserved.
  if (name.endsWith(".txt") || name.endsWith(".tex") || name.endsWith(".md")) {
    return buf.toString("utf8").trim();
  }
  throw new Error("Unsupported file type. Upload a PDF, DOCX, TXT, or .tex.");
}

const PARSE_SYSTEM = `You convert resume text into structured JSON.
Return ONLY a JSON object matching exactly this shape (omit nothing; use empty strings/arrays where unknown):
{
  "contact": { "fullName": "", "headline": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "website": "" },
  "summary": "",
  "experience": [ { "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "current": false, "bullets": [""] } ],
  "education": [ { "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "gpa": "", "details": [""] } ],
  "projects": [ { "name": "", "description": "", "url": "", "bullets": [""], "technologies": [""] } ],
  "skills": [ { "category": "", "skills": [""] } ],
  "certifications": [""],
  "languages": [""],
  "customAnswers": [],
  "customSections": [ { "title": "", "items": [""] } ]
}
Rules:
- "contact.headline" is the short professional title/role line that usually sits right under the name (e.g. "Project Manager (Engineering)" or "AI & Full-Stack Developer"). Capture it if present; leave "" if there isn't one. This is NOT the summary.
- Preserve the candidate's wording in bullets. Dates as written (e.g. "Jan 2022"). Set current=true for ongoing roles. Do not invent facts.
- Headings vary between resumes. Map them by MEANING, not exact text:
  - "Employment" / "Work History" / "Professional Experience" / "Internship" / "Career" -> experience
  - "Core Competencies" / "Technical Skills" / "Areas of Expertise" / "Tools" -> skills (use the heading as the category)
  - "Profile" / "About" / "Objective" / "Profile Summary" -> summary
  - "Academic Projects" / "Key Projects" / "Selected Work" -> projects
  - "Certifications" / "Trainings" / "Licenses" -> certifications
- Group skills under sensible categories. For the summary, if it's a list of points, join them into a short paragraph.
- CRITICAL — never drop content. Any titled section that does NOT fit a field above (e.g. "Achievements", "Awards", "Patents", "Highlights", "Publications", "Volunteering", "Extracurricular Activities", "Personal Details") goes into customSections as { "title": <heading as written>, "items": [<each line>] }. When unsure where something belongs, put it in customSections rather than discarding it.`;

// Generous enough for dense 3–4 page resumes: ~40k chars of input (the model
// rarely needs more) and 8k output tokens so the structured JSON isn't cut off.
const MAX_INPUT_CHARS = 40000;
const MAX_OUTPUT_TOKENS = 8192;

/** Parse extracted resume text into a validated MasterProfile via the LLM. */
export async function parseResumeToProfile(
  text: string,
  creds: AiCreds
): Promise<MasterProfile> {
  if (!text || text.length < 30) {
    throw new AiError("Couldn't read enough text from that file.");
  }
  const truncated = text.length > MAX_INPUT_CHARS;

  let json: unknown;
  try {
    json = await completeJson<unknown>(creds, {
      system: PARSE_SYSTEM,
      prompt: `Resume text:\n\n${text.slice(0, MAX_INPUT_CHARS)}`,
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: 0,
    });
  } catch (err) {
    // A long resume can overrun the model's output budget and come back as
    // truncated/invalid JSON. Give a length-aware hint instead of a generic one.
    if (err instanceof AiError && text.length > 15000) {
      throw new AiError(
        "This resume is long and the AI response was cut off before finishing. Try removing a section or uploading a shorter version."
      );
    }
    throw err;
  }

  // The schema fills defaults for any missing keys; reject hard mismatches.
  const result = masterProfileSchema.safeParse(json);
  if (!result.success) {
    throw new AiError(
      truncated
        ? "This resume was too long to read fully — some of it was cut off. Try a shorter version."
        : "The model's output didn't match the expected resume format. Try again."
    );
  }
  return result.data;
}
