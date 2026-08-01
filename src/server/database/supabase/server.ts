import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/server/database/supabase/database.types";
import { getPublicSupabaseEnvironment } from "@/shared/validation/environment";

export async function createClient() {
  const cookieStore = await cookies();
  const environment = getPublicSupabaseEnvironment();

  return createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. The request proxy will
            // own session refresh when authentication is connected.
          }
        },
      },
    },
  );
}
