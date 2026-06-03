import { and, eq } from "drizzle-orm";
import { layoutPrefsSchema, masterProfileSchema } from "@builder/shared";
import { db, masterProfiles } from "@builder/db";
import { getCurrentUser } from "@/lib/dal";
import { renderResumePdf } from "@/lib/pdf/autofit";

/**
 * Renders a resume PDF straight from a master profile (no job/tailoring needed)
 * so the profile editor can show a live preview of what will be produced.
 * `?pages=N` (1–4) fits within N pages for instant preview; otherwise the
 * profile's saved layout preference is used.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [profile] = await db
    .select()
    .from(masterProfiles)
    .where(and(eq(masterProfiles.id, id), eq(masterProfiles.userId, user.id)))
    .limit(1);
  if (!profile) return new Response("Not found", { status: 404 });

  const data = masterProfileSchema.parse(profile.data);

  // Query params let the editor preview layout tweaks instantly, before saving;
  // fall back to the profile's persisted layout. Bad values fall back too.
  const q = new URL(req.url).searchParams;
  const parsed = layoutPrefsSchema.safeParse({
    pageTarget: q.has("pages") ? Number(q.get("pages")) : data.layout.pageTarget,
    template: q.get("template") ?? data.layout.template,
    accent: q.get("accent") ?? data.layout.accent,
    showSummary: q.has("summary")
      ? q.get("summary") !== "0"
      : data.layout.showSummary,
  });
  const layout = parsed.success ? parsed.data : data.layout;
  const effective = { ...data, layout };

  const buffer = await renderResumePdf(effective, layout.pageTarget);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="resume-preview.pdf"`,
      "cache-control": "no-store",
    },
  });
}
