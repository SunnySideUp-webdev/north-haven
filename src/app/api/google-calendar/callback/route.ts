import { timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  exchangeGoogleCode,
  getGoogleAccount,
  getGoogleCalendars,
} from "@/features/calendar-sync/google";
import { saveGoogleConnection } from "@/features/calendar-sync/sync";
import { requireAuthenticatedContext } from "@/server/auth/session";
import { getPublicSupabaseEnvironment } from "@/shared/validation/environment";

export const dynamic = "force-dynamic";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function settingsRedirect(code: string) {
  return new URL(
    `/settings?calendar=${code}#calendar-connection`,
    getPublicSupabaseEnvironment().NEXT_PUBLIC_APP_URL,
  );
}

export async function GET(request: NextRequest) {
  const responseError = request.nextUrl.searchParams.get("error");
  if (responseError) {
    const response = NextResponse.redirect(
      settingsRedirect(responseError === "access_denied" ? "denied" : "failed"),
    );
    response.cookies.delete("north_haven_google_oauth");
    return response;
  }

  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("north_haven_google_oauth")?.value;
  const { userId, supabase } = await requireAuthenticatedContext();
  let stored: { state?: string; userId?: string } = {};
  try {
    stored = JSON.parse(
      Buffer.from(stateCookie ?? "", "base64url").toString("utf8"),
    ) as typeof stored;
  } catch {
    stored = {};
  }

  if (
    !code ||
    !returnedState ||
    !stored.state ||
    stored.userId !== userId ||
    !safeEqual(returnedState, stored.state)
  ) {
    const response = NextResponse.redirect(settingsRedirect("invalid-state"));
    response.cookies.delete("north_haven_google_oauth");
    return response;
  }

  try {
    const { data: workspaceId, error } = await supabase.rpc(
      "current_personal_workspace_id",
    );
    if (error || !workspaceId) throw new Error("Workspace not found.");
    const appUrl = getPublicSupabaseEnvironment().NEXT_PUBLIC_APP_URL;
    const redirectUri = new URL(
      "/api/google-calendar/callback",
      appUrl,
    ).toString();
    const tokens = await exchangeGoogleCode(code, redirectUri);
    const [account, calendars] = await Promise.all([
      getGoogleAccount(tokens.access_token),
      getGoogleCalendars(tokens.access_token),
    ]);
    await saveGoogleConnection({ account, calendars, tokens, workspaceId });

    const response = NextResponse.redirect(settingsRedirect("connected"));
    response.cookies.delete("north_haven_google_oauth");
    return response;
  } catch {
    const response = NextResponse.redirect(settingsRedirect("failed"));
    response.cookies.delete("north_haven_google_oauth");
    return response;
  }
}
