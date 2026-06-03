import { and, eq } from "drizzle-orm";
import { masterProfileSchema } from "@builder/shared";
import { db, tailoredDocuments } from "@builder/db";
import { getCurrentUser } from "@/lib/dal";
import { resumeToLatex, coverLetterToLatex } from "@/lib/pdf/resume-latex";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [doc] = await db
    .select()
    .from(tailoredDocuments)
    .where(
      and(eq(tailoredDocuments.id, id), eq(tailoredDocuments.userId, user.id))
    )
    .limit(1);
  if (!doc) return new Response("Not found", { status: 404 });

  let tex: string;
  let filename: string;
  if (doc.type === "resume") {
    tex = resumeToLatex(masterProfileSchema.parse(doc.content));
    filename = "resume.tex";
  } else {
    const c = doc.content as { body: string; name: string; contactLine: string };
    tex = coverLetterToLatex(c);
    filename = "cover-letter.tex";
  }

  return new Response(tex, {
    headers: {
      "content-type": "application/x-tex; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
