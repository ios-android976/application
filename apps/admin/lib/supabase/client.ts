import type { Database } from "@coffee/shared";
import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for Client Components (realtime, storage uploads). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
