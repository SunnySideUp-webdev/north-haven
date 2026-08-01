import "server-only";

import {
  expandAllDayDates,
  normalizeGoogleEventWindow,
} from "@/features/calendar-sync/date";
import {
  decryptCalendarToken,
  encryptCalendarToken,
} from "@/features/calendar-sync/crypto";
import {
  getGoogleEventChanges,
  GoogleCalendarError,
  refreshGoogleAccessToken,
  revokeGoogleToken,
  type GoogleCalendarEvent,
  type GoogleCalendarListEntry,
  type GoogleTokenResponse,
} from "@/features/calendar-sync/google";
import { requireCalendarServerContext } from "@/features/calendar-sync/server-context";
import { createAdminClient } from "@/server/database/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

function safeProviderCode(error: unknown) {
  if (error instanceof GoogleCalendarError) return error.code.slice(0, 80);
  return "calendar_sync_failed";
}

function eventType(value?: string) {
  if (value === "outOfOffice") return "out_of_office" as const;
  if (value === "focusTime") return "focus_time" as const;
  if (!value || value === "default") return "default" as const;
  return "other" as const;
}

async function currentAccessToken(
  admin: AdminClient,
  connection: {
    access_token_encrypted: string;
    access_token_expires_at: string;
    id: string;
    refresh_token_encrypted: string;
  },
) {
  if (
    new Date(connection.access_token_expires_at).getTime() >
    Date.now() + 60_000
  ) {
    return decryptCalendarToken(connection.access_token_encrypted);
  }

  const refreshToken = decryptCalendarToken(connection.refresh_token_encrypted);
  const refreshed = await refreshGoogleAccessToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000,
  ).toISOString();
  const { error } = await admin
    .from("calendar_connections")
    .update({
      access_token_encrypted: encryptCalendarToken(refreshed.access_token),
      access_token_expires_at: expiresAt,
    })
    .eq("id", connection.id);
  if (error) throw new Error("Calendar token could not be refreshed.");
  return refreshed.access_token;
}

async function removeGoogleDaysForCalendar(
  admin: AdminClient,
  workspaceId: string,
  calendarId: string,
) {
  const { error } = await admin
    .from("non_working_days")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("source", "google")
    .like("source_event_id", `${calendarId}:%`);
  if (error) throw new Error("Calendar OOO dates could not be refreshed.");
}

async function saveEventChange({
  admin,
  calendarId,
  event,
  workspaceId,
  workspaceTimeZone,
}: {
  admin: AdminClient;
  calendarId: string;
  event: GoogleCalendarEvent;
  workspaceId: string;
  workspaceTimeZone: string;
}) {
  const sourceEventId = `${calendarId}:${event.id}`;
  await admin
    .from("non_working_days")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("source", "google")
    .eq("source_event_id", sourceEventId);

  if (event.status === "cancelled" || !event.start || !event.end) {
    const { error } = await admin
      .from("external_calendar_events")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("external_calendar_id", calendarId)
      .eq("provider_event_id", event.id);
    if (error) throw new Error("A removed calendar event could not be synced.");
    return;
  }

  const window = normalizeGoogleEventWindow(
    event.start,
    event.end,
    workspaceTimeZone,
  );
  if (!window || new Date(window.endsAt) <= new Date(window.startsAt)) return;

  const normalizedType = eventType(event.eventType);
  const { error } = await admin.from("external_calendar_events").upsert(
    {
      end_local_date: window.endLocalDate,
      ends_at: window.endsAt,
      event_type: normalizedType,
      external_calendar_id: calendarId,
      ical_uid: event.iCalUID ?? null,
      is_all_day: window.isAllDay,
      meeting_url: event.hangoutLink ?? null,
      provider_event_id: event.id,
      provider_url: event.htmlLink ?? null,
      provider_updated_at: event.updated ?? null,
      start_local_date: window.startLocalDate,
      starts_at: window.startsAt,
      status: event.status ?? "confirmed",
      synced_at: new Date().toISOString(),
      title: event.summary?.trim() || "Untitled event",
      workspace_id: workspaceId,
    },
    { onConflict: "external_calendar_id,provider_event_id" },
  );
  if (error) throw new Error("A calendar event could not be synced.");

  if (
    normalizedType === "out_of_office" &&
    window.isAllDay &&
    event.start.date &&
    event.end.date
  ) {
    const rows = expandAllDayDates(event.start.date, event.end.date).map(
      (workDate) => ({
        allows_urgent_work: true,
        kind: "out_of_office" as const,
        source: "google" as const,
        source_event_id: sourceEventId,
        work_date: workDate,
        workspace_id: workspaceId,
      }),
    );
    if (rows.length) {
      const { error: dayError } = await admin
        .from("non_working_days")
        .insert(rows);
      if (dayError) throw new Error("Calendar OOO dates could not be synced.");
    }
  }
}

async function syncOneCalendar({
  accessToken,
  admin,
  calendar,
  workspaceId,
  workspaceTimeZone,
}: {
  accessToken: string;
  admin: AdminClient;
  calendar: {
    id: string;
    provider_calendar_id: string;
    sync_token: string | null;
  };
  workspaceId: string;
  workspaceTimeZone: string;
}) {
  let syncToken = calendar.sync_token;
  let changes;

  try {
    changes = await getGoogleEventChanges({
      accessToken,
      calendarId: calendar.provider_calendar_id,
      syncToken,
    });
  } catch (error) {
    if (!(error instanceof GoogleCalendarError) || error.status !== 410)
      throw error;
    await removeGoogleDaysForCalendar(admin, workspaceId, calendar.id);
    const { error: deleteError } = await admin
      .from("external_calendar_events")
      .delete()
      .eq("external_calendar_id", calendar.id)
      .eq("workspace_id", workspaceId);
    if (deleteError) throw new Error("Calendar could not be fully refreshed.");
    syncToken = null;
    changes = await getGoogleEventChanges({
      accessToken,
      calendarId: calendar.provider_calendar_id,
    });
  }

  for (const event of changes.events) {
    await saveEventChange({
      admin,
      calendarId: calendar.id,
      event,
      workspaceId,
      workspaceTimeZone,
    });
  }

  const { error } = await admin
    .from("external_calendars")
    .update({
      last_synced_at: new Date().toISOString(),
      sync_token: changes.nextSyncToken ?? syncToken,
    })
    .eq("id", calendar.id)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error("Calendar sync state could not be saved.");
}

export async function syncGoogleCalendar(workspaceId: string) {
  const admin = createAdminClient();
  const { data: connection, error: connectionError } = await admin
    .from("calendar_connections")
    .select(
      "id, access_token_encrypted, refresh_token_encrypted, access_token_expires_at, last_synced_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("provider", "google")
    .maybeSingle();
  if (connectionError || !connection)
    throw new Error("Calendar is not connected.");

  try {
    const accessToken = await currentAccessToken(admin, connection);
    const [{ data: calendars, error: calendarsError }, { data: schedule }] =
      await Promise.all([
        admin
          .from("external_calendars")
          .select("id, provider_calendar_id, sync_token")
          .eq("workspace_id", workspaceId)
          .eq("calendar_connection_id", connection.id)
          .eq("is_selected", true),
        admin
          .from("work_schedules")
          .select("time_zone")
          .eq("workspace_id", workspaceId)
          .maybeSingle(),
      ]);
    if (calendarsError)
      throw new Error("Selected calendars could not be loaded.");

    for (const calendar of calendars ?? []) {
      await syncOneCalendar({
        accessToken,
        admin,
        calendar,
        workspaceId,
        workspaceTimeZone: schedule?.time_zone ?? "America/Guatemala",
      });
    }

    const syncedAt = new Date().toISOString();
    const { error } = await admin
      .from("calendar_connections")
      .update({
        last_error_code: null,
        last_synced_at: syncedAt,
        status: "connected",
      })
      .eq("id", connection.id)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error("Calendar connection state could not be saved.");
    return syncedAt;
  } catch (error) {
    const disconnected =
      error instanceof GoogleCalendarError &&
      (error.status === 401 || error.code === "invalid_grant");
    await admin
      .from("calendar_connections")
      .update({
        last_error_code: safeProviderCode(error),
        status: disconnected
          ? "disconnected"
          : connection.last_synced_at
            ? "stale"
            : "error",
      })
      .eq("id", connection.id)
      .eq("workspace_id", workspaceId);
    throw error;
  }
}

export async function saveGoogleConnection({
  account,
  calendars,
  tokens,
  workspaceId,
}: {
  account: { email: string; sub: string };
  calendars: GoogleCalendarListEntry[];
  tokens: GoogleTokenResponse;
  workspaceId: string;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("calendar_connections")
    .select("id, provider_account_id, refresh_token_encrypted")
    .eq("workspace_id", workspaceId)
    .eq("provider", "google")
    .maybeSingle();
  const refreshToken = tokens.refresh_token
    ? tokens.refresh_token
    : existing?.provider_account_id === account.sub
      ? decryptCalendarToken(existing.refresh_token_encrypted)
      : null;
  if (!refreshToken) throw new Error("Google did not return offline access.");

  const scopes = (tokens.scope ?? "").split(" ").filter(Boolean);
  const requiredScopes = [
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  ];
  if (!requiredScopes.every((scope) => scopes.includes(scope))) {
    throw new Error("Google Calendar read-only access was not fully granted.");
  }

  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000,
  ).toISOString();
  const { data: connection, error } = await admin
    .from("calendar_connections")
    .upsert(
      {
        access_token_encrypted: encryptCalendarToken(tokens.access_token),
        access_token_expires_at: expiresAt,
        account_label: account.email,
        last_error_code: null,
        provider: "google",
        provider_account_id: account.sub,
        refresh_token_encrypted: encryptCalendarToken(refreshToken),
        scopes,
        status: "connected",
        workspace_id: workspaceId,
      },
      { onConflict: "workspace_id,provider" },
    )
    .select("id")
    .single();
  if (error || !connection)
    throw new Error("Calendar connection could not be saved.");

  const { data: existingCalendars } = await admin
    .from("external_calendars")
    .select("provider_calendar_id, is_selected")
    .eq("calendar_connection_id", connection.id)
    .eq("workspace_id", workspaceId);
  const selectedById = new Map(
    (existingCalendars ?? []).map((calendar) => [
      calendar.provider_calendar_id,
      calendar.is_selected,
    ]),
  );
  const rows = calendars.map((calendar) => ({
    calendar_connection_id: connection.id,
    is_primary: Boolean(calendar.primary),
    is_selected: selectedById.get(calendar.id) ?? Boolean(calendar.primary),
    name: calendar.summary || "Google Calendar",
    provider_calendar_id: calendar.id,
    time_zone: calendar.timeZone ?? null,
    workspace_id: workspaceId,
  }));
  if (!rows.length) throw new Error("No readable Google calendars were found.");
  const { error: calendarError } = await admin
    .from("external_calendars")
    .upsert(rows, {
      onConflict: "calendar_connection_id,provider_calendar_id",
    });
  if (calendarError) throw new Error("Google calendars could not be saved.");

  const providerCalendarIds = new Set(
    rows.map((row) => row.provider_calendar_id),
  );
  const { data: storedCalendars } = await admin
    .from("external_calendars")
    .select("id, provider_calendar_id")
    .eq("calendar_connection_id", connection.id)
    .eq("workspace_id", workspaceId);
  for (const storedCalendar of storedCalendars ?? []) {
    if (!providerCalendarIds.has(storedCalendar.provider_calendar_id)) {
      await removeGoogleDaysForCalendar(admin, workspaceId, storedCalendar.id);
      const { error: removeError } = await admin
        .from("external_calendars")
        .delete()
        .eq("id", storedCalendar.id)
        .eq("workspace_id", workspaceId);
      if (removeError)
        throw new Error("An unavailable calendar could not be removed.");
    }
  }

  await syncGoogleCalendar(workspaceId);
}

export async function setCalendarSelected(
  calendarId: string,
  selected: boolean,
) {
  const { admin, workspaceId } = await requireCalendarServerContext();
  const { data: calendar, error } = await admin
    .from("external_calendars")
    .update({ is_selected: selected, sync_token: selected ? null : undefined })
    .eq("id", calendarId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();
  if (error || !calendar)
    throw new Error("Calendar selection could not be saved.");

  if (!selected) {
    await removeGoogleDaysForCalendar(admin, workspaceId, calendarId);
    return;
  }
  await syncGoogleCalendar(workspaceId);
}

export async function disconnectGoogleCalendar() {
  const { admin, workspaceId } = await requireCalendarServerContext();
  const { data: connection } = await admin
    .from("calendar_connections")
    .select("id, refresh_token_encrypted")
    .eq("workspace_id", workspaceId)
    .eq("provider", "google")
    .maybeSingle();
  if (!connection) return;

  try {
    await revokeGoogleToken(
      decryptCalendarToken(connection.refresh_token_encrypted),
    );
  } catch {
    // Local disconnection must still succeed if Google is unavailable.
  }
  await admin
    .from("non_working_days")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("source", "google");
  const { error } = await admin
    .from("calendar_connections")
    .delete()
    .eq("id", connection.id)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error("Calendar could not be disconnected.");
}
