import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getGoogleAuthorizationUrl } from "@/features/calendar-sync/google";
import { requireAuthenticatedContext } from "@/server/auth/session";
import {
  getGoogleCalendarEnvironment,
  getPublicSupabaseEnvironment,
} from "@/shared/validation/environment";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await requireAuthenticatedContext();
  const appUrl = getPublicSupabaseEnvironment().NEXT_PUBLIC_APP_URL;
  if (!getGoogleCalendarEnvironment()) {
    return NextResponse.redirect(
      new URL("/settings?calendar=setup-required", appUrl),
    );
  }

  const state = randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(
    "north_haven_google_oauth",
    Buffer.from(JSON.stringify({ state, userId })).toString("base64url"),
    {
      httpOnly: true,
      maxAge: 10 * 60,
      path: "/api/google-calendar/callback",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );

  const redirectUri = new URL(
    "/api/google-calendar/callback",
    appUrl,
  ).toString();
  return NextResponse.redirect(getGoogleAuthorizationUrl(state, redirectUri));
}
