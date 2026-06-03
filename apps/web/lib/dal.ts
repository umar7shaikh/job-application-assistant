import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@builder/db";
import { getSession } from "./session";

/**
 * Data Access Layer. Centralizes the "who is the current user" check so auth
 * is verified close to the data (per Next.js security guidance). `cache()`
 * dedupes the lookup within a single render/request.
 */

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return rows[0] ?? null;
});

export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});
