import type { Database } from "@coffee/shared";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

/**
 * Refreshes the Supabase session cookie on every request and sends visitors
 * without a session to /login. This is only the optimistic check: pages and
 * server actions verify admin access again, and RLS enforces it in the database.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  // No-cache headers the auth library asks for whenever it writes cookies.
  const authHeaders: Record<string, string> = {};

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.assign(authHeaders, headers);
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims(): it is what
  // refreshes an expired session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const redirectTo = (target: string, next: string | null) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    if (next) url.searchParams.set("next", next);
    const redirect = NextResponse.redirect(url);
    // Carry refreshed (or cleared) auth cookies over to the redirect.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    Object.entries(authHeaders).forEach(([key, value]) => redirect.headers.set(key, value));
    return redirect;
  };

  if (!signedIn && !isPublic) return redirectTo("/login", pathname !== "/" ? pathname : null);
  if (signedIn && pathname === "/login") return redirectTo("/", null);

  return response;
}
