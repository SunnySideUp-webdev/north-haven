import { NextResponse } from "next/server";

import { createClient } from "@/server/database/supabase/server";

const allowedDestinations = new Set(["/setup", "/today", "/update-password"]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedDestination = requestUrl.searchParams.get("next") ?? "/today";
  const destination = allowedDestinations.has(requestedDestination)
    ? requestedDestination
    : "/today";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/sign-in", requestUrl.origin));
}
