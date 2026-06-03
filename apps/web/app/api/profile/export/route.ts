import { desc, eq } from "drizzle-orm";
import { db, masterProfiles } from "@builder/db";
import { getCurrentUser } from "@/lib/dal";

/**
 * Read-only profile export for the browser extension. Authenticated by the
 * app's session cookie (the extension fetches with credentials + host
 * permission, so the httpOnly cookie rides along). Returns the default resume.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const [p] = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, user.id))
    .orderBy(desc(masterProfiles.isDefault), desc(masterProfiles.updatedAt))
    .limit(1);

  if (!p) return Response.json({ error: "no-profile" }, { status: 404 });

  return Response.json(
    { name: p.name, profile: p.data },
    {
      headers: {
        // Allow the extension (and only read access) to consume this.
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
      },
    }
  );
}
