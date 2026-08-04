import "server-only";

import { GOOGLE_CALENDAR_SCOPES } from "@/features/calendar-sync/permissions";
import { getGoogleCalendarEnvironment } from "@/shared/validation/environment";

export class GoogleCalendarError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super("Google Calendar request failed.");
  }
}

const googleRequestTimeoutMs = 15_000;

function requireEnvironment() {
  const environment = getGoogleCalendarEnvironment();
  if (!environment) throw new Error("Google Calendar is not configured.");
  return environment;
}

async function fetchGoogle(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), googleRequestTimeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GoogleCalendarError("timeout", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readGoogleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let code = `http_${response.status}`;
    try {
      const body = (await response.json()) as {
        error?: string | { errors?: { reason?: string }[] };
      };
      code =
        typeof body.error === "string"
          ? body.error
          : (body.error?.errors?.[0]?.reason ?? code);
    } catch {
      // Never include a provider response body in application errors.
    }
    throw new GoogleCalendarError(code, response.status);
  }
  return (await response.json()) as T;
}

export function getGoogleAuthorizationUrl(state: string, redirectUri: string) {
  const environment = requireEnvironment();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    access_type: "offline",
    client_id: environment.GOOGLE_CALENDAR_CLIENT_ID,
    include_granted_scopes: "true",
    prompt: "consent select_account",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    state,
  }).toString();
  return url;
}

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const environment = requireEnvironment();
  const response = await fetchGoogle("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: environment.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: environment.GOOGLE_CALENDAR_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  return readGoogleResponse<GoogleTokenResponse>(response);
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const environment = requireEnvironment();
  const response = await fetchGoogle("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: environment.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: environment.GOOGLE_CALENDAR_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  return readGoogleResponse<GoogleTokenResponse>(response);
}

export async function revokeGoogleToken(token: string) {
  await fetchGoogle("https://oauth2.googleapis.com/revoke", {
    body: new URLSearchParams({ token }),
    cache: "no-store",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
}

export async function getGoogleAccount(accessToken: string) {
  const response = await fetchGoogle(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      cache: "no-store",
      headers: { authorization: `Bearer ${accessToken}` },
    },
  );
  return readGoogleResponse<{ email: string; sub: string }>(response);
}

export type GoogleCalendarListEntry = {
  accessRole?: string;
  backgroundColor?: string;
  id: string;
  primary?: boolean;
  selected?: boolean;
  summary: string;
  timeZone?: string;
};

export async function getGoogleCalendars(accessToken: string) {
  const calendars: GoogleCalendarListEntry[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    );
    url.searchParams.set("maxResults", "250");
    url.searchParams.set("minAccessRole", "reader");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetchGoogle(url, {
      cache: "no-store",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const body = await readGoogleResponse<{
      items?: GoogleCalendarListEntry[];
      nextPageToken?: string;
    }>(response);
    calendars.push(...(body.items ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);

  return calendars;
}

export type GoogleCalendarEvent = {
  end?: { date?: string; dateTime?: string; timeZone?: string };
  eventType?: string;
  hangoutLink?: string;
  htmlLink?: string;
  iCalUID?: string;
  id: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  status?: string;
  summary?: string;
  updated?: string;
};

export async function getGoogleEventChanges({
  accessToken,
  calendarId,
  syncToken,
}: {
  accessToken: string;
  calendarId: string;
  syncToken?: string | null;
}) {
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;

  do {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    url.searchParams.set("maxResults", "2500");
    url.searchParams.set("showDeleted", "true");
    url.searchParams.set("singleEvents", "true");
    url.searchParams.append("eventTypes", "default");
    url.searchParams.append("eventTypes", "outOfOffice");
    url.searchParams.append("eventTypes", "focusTime");
    if (syncToken) {
      url.searchParams.set("syncToken", syncToken);
    } else {
      const earliest = new Date();
      earliest.setUTCDate(earliest.getUTCDate() - 120);
      const latest = new Date();
      latest.setUTCDate(latest.getUTCDate() + 400);
      url.searchParams.set("timeMin", earliest.toISOString());
      url.searchParams.set("timeMax", latest.toISOString());
    }
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetchGoogle(url, {
      cache: "no-store",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const body = await readGoogleResponse<{
      items?: GoogleCalendarEvent[];
      nextPageToken?: string;
      nextSyncToken?: string;
    }>(response);
    events.push(...(body.items ?? []));
    pageToken = body.nextPageToken;
    nextSyncToken = body.nextSyncToken ?? nextSyncToken;
  } while (pageToken);

  return { events, nextSyncToken };
}
