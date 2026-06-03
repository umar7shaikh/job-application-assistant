import { renderToBuffer } from "@react-pdf/renderer";
import { and, eq } from "drizzle-orm";
import { masterProfileSchema } from "@builder/shared";
import { db, tailoredDocuments } from "@builder/db";
import { getCurrentUser } from "@/lib/dal";
import { renderResumePdf } from "@/lib/pdf/autofit";
import { coverElement } from "@/lib/pdf/cover-letter-doc";

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

  let buffer: Buffer;
  let filename: string;
  if (doc.type === "resume") {
    const data = masterProfileSchema.parse(doc.content);
    buffer = await renderResumePdf(data, data.layout.pageTarget);
    filename = "resume.pdf";
  } else {
    const c = doc.content as { body: string; name: string; contactLine: string };
    buffer = await renderToBuffer(coverElement(c));
    filename = "cover-letter.pdf";
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
