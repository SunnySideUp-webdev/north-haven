import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/server/database/supabase/database.types";
import { getPublicSupabaseEnvironment } from "@/shared/validation/environment";

const protectedPathPrefixes = [
  "/today",
  "/plan",
  "/work",
  "/calendar",
  "/insights",
  "/settings",
  "/setup",
  "/update-password",
];

const guestOnlyPaths = ["/sign-in", "/create-account", "/forgot-password"];

export function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isGuestOnlyPath(pathname: string) {
  return guestOnlyPaths.includes(pathname);
}

export function getLoopbackCanonicalRedirect(
  requestUrl: URL,
  configuredAppUrl: string,
  requestHost = requestUrl.host,
) {
  const canonicalUrl = new URL(configuredAppUrl);
  const loopbackHosts = new Set(["127.0.0.1", "localhost"]);
  const normalizedRequestHost = requestHost.split(",")[0]?.trim();
  const requestOrigin = normalizedRequestHost
    ? new URL(`${requestUrl.protocol}//${normalizedRequestHost}`).origin
    : requestUrl.origin;

  if (
    !loopbackHosts.has(canonicalUrl.hostname) ||
    requestOrigin === canonicalUrl.origin
  ) {
    return null;
  }

  const redirectUrl = new URL(requestUrl.pathname, canonicalUrl.origin);
  redirectUrl.search = requestUrl.search;
  return redirectUrl;
}

export function createCanonicalRedirectDocument(destination: URL) {
  const escapedDestination = destination
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=${escapedDestination}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Opening North Haven</title>
  </head>
  <body>
    <p>Opening North Haven…</p>
    <p><a href="${escapedDestination}">Continue</a></p>
  </body>
</html>`;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  const redirectResponse = NextResponse.redirect(redirectUrl);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const environment = getPublicSupabaseEnvironment();
  const requestHost =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  const canonicalRedirect = getLoopbackCanonicalRedirect(
    request.nextUrl,
    environment.NEXT_PUBLIC_APP_URL,
    requestHost,
  );

  if (canonicalRedirect) {
    return new Response(createCanonicalRedirectDocument(canonicalRedirect), {
      headers: {
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
      },
      status: 200,
    });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  let isAuthenticated = false;

  try {
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims?.sub);
  } catch {
    isAuthenticated = false;
  }
  const { pathname } = request.nextUrl;

  if (!isAuthenticated && isProtectedPath(pathname)) {
    return redirectWithCookies(request, response, "/sign-in");
  }

  if (isAuthenticated && isGuestOnlyPath(pathname)) {
    return redirectWithCookies(request, response, "/");
  }

  return response;
}
