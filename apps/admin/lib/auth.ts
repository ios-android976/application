import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string | null;
  isAdmin: boolean;
};

/** Verified session for the current request (JWT signature checked by getClaims). */
export const getSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: membership } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", claims.sub)
    .maybeSingle();

  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    isAdmin: Boolean(membership),
  };
});

/**
 * Use at the top of every admin page and server action. Server actions are
 * public HTTP endpoints, so the layout check alone is not enough.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/no-access");
  return session;
}
