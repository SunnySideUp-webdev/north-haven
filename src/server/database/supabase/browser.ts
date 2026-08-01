import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/server/database/supabase/database.types";
import { getPublicSupabaseEnvironment } from "@/shared/validation/environment";

export function createClient() {
  const environment = getPublicSupabaseEnvironment();

  return createBrowserClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
