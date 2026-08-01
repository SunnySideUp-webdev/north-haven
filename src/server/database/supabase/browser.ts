import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnvironment } from "@/shared/validation/environment";

export function createClient() {
  const environment = getPublicSupabaseEnvironment();

  return createBrowserClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
