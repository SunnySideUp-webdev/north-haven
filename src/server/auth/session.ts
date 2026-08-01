import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/server/database/supabase/server";

export async function getAuthContext() {
  const supabase = await createClient();
  let userId: string | undefined;

  try {
    const { data, error } = await supabase.auth.getClaims();
    userId = error ? undefined : data?.claims?.sub;
  } catch {
    userId = undefined;
  }

  if (!userId) {
    return { profile: null, supabase, userId: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, setup_completed_at, time_zone")
    .eq("id", userId)
    .maybeSingle();

  return { profile, supabase, userId };
}

export async function requireAuthenticatedContext() {
  const context = await getAuthContext();

  if (!context.userId) {
    redirect("/sign-in");
  }

  return context;
}

export async function redirectAuthenticatedUser() {
  const { profile, userId } = await getAuthContext();

  if (!userId) {
    return;
  }

  redirect(profile?.setup_completed_at ? "/today" : "/setup");
}
