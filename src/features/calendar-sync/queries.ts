import "server-only";

import type {
  CalendarDayView,
  CalendarSettingsView,
} from "@/features/calendar-sync/types";
import { requireCalendarServerContext } from "@/features/calendar-sync/server-context";
import { getGoogleCalendarEnvironment } from "@/shared/validation/environment";

function connectionState(
  status: "connected" | "stale" | "disconnected" | "error",
  lastSyncedAt: string | null,
) {
  if (
    status === "connected" &&
    lastSyncedAt &&
    Date.now() - new Date(lastSyncedAt).getTime() > 24 * 60 * 60 * 1000
  ) {
    return "stale" as const;
  }
  return status;
}

export async function getCalendarSettings(): Promise<CalendarSettingsView> {
  const configured = Boolean(getGoogleCalendarEnvironment());
  if (!configured) return { configured, connection: null };

  const { admin, workspaceId } = await requireCalendarServerContext();
  const { data: connection, error } = await admin
    .from("calendar_connections")
    .select("id, account_label, status, last_synced_at")
    .eq("workspace_id", workspaceId)
    .eq("provider", "google")
    .maybeSingle();
  if (error) throw new Error("Calendar settings could not be loaded.");
  if (!connection) return { configured, connection: null };

  const { data: calendars, error: calendarsError } = await admin
    .from("external_calendars")
    .select("id, name, time_zone, is_primary, is_selected")
    .eq("workspace_id", workspaceId)
    .eq("calendar_connection_id", connection.id)
    .order("is_primary", { ascending: false })
    .order("name");
  if (calendarsError) throw new Error("Calendars could not be loaded.");

  return {
    configured,
    connection: {
      accountLabel: connection.account_label,
      calendars: (calendars ?? []).map((calendar) => ({
        id: calendar.id,
        isPrimary: calendar.is_primary,
        isSelected: calendar.is_selected,
        name: calendar.name,
        timeZone: calendar.time_zone,
      })),
      lastSyncedAt: connection.last_synced_at,
      state: connectionState(connection.status, connection.last_synced_at),
    },
  };
}

export async function getCalendarDay(
  workDate: string,
): Promise<CalendarDayView> {
  if (!getGoogleCalendarEnvironment()) {
    return { connection: null, isOutOfOffice: false, meetings: [] };
  }
  const { admin, workspaceId } = await requireCalendarServerContext();
  const { data: connection } = await admin
    .from("calendar_connections")
    .select("status, last_synced_at")
    .eq("workspace_id", workspaceId)
    .eq("provider", "google")
    .maybeSingle();
  if (!connection) {
    return { connection: null, isOutOfOffice: false, meetings: [] };
  }

  const { data: selectedCalendars } = await admin
    .from("external_calendars")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("is_selected", true);
  const calendarIds = (selectedCalendars ?? []).map((calendar) => calendar.id);
  if (!calendarIds.length) {
    return {
      connection: {
        lastSyncedAt: connection.last_synced_at,
        state: connectionState(connection.status, connection.last_synced_at),
      },
      isOutOfOffice: false,
      meetings: [],
    };
  }

  const { data: events, error } = await admin
    .from("external_calendar_events")
    .select(
      "id, ical_uid, title, starts_at, ends_at, is_all_day, event_type, status, meeting_url, provider_url",
    )
    .eq("workspace_id", workspaceId)
    .in("external_calendar_id", calendarIds)
    .lte("start_local_date", workDate)
    .gte("end_local_date", workDate)
    .neq("status", "cancelled")
    .order("starts_at");
  if (error) throw new Error("Calendar events could not be loaded.");

  const eventIds = (events ?? []).map((event) => event.id);
  const { data: outcomes } = eventIds.length
    ? await admin
        .from("meeting_outcomes")
        .select("external_calendar_event_id, attendance_status")
        .eq("workspace_id", workspaceId)
        .in("external_calendar_event_id", eventIds)
    : { data: [] };
  const outcomeByEvent = new Map(
    (outcomes ?? []).map((outcome) => [
      outcome.external_calendar_event_id,
      outcome.attendance_status,
    ]),
  );
  const seen = new Set<string>();
  const meetings = (events ?? [])
    .filter((event) => event.event_type === "default" && !event.is_all_day)
    .filter((event) => {
      const identity = event.ical_uid ?? event.id;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .map((event) => ({
      attendanceStatus:
        outcomeByEvent.get(event.id) ??
        (new Date(event.ends_at) < new Date()
          ? ("probably_attended" as const)
          : ("unconfirmed" as const)),
      endsAt: event.ends_at,
      id: event.id,
      meetingUrl: event.meeting_url,
      providerUrl: event.provider_url,
      startsAt: event.starts_at,
      title: event.title,
    }));

  return {
    connection: {
      lastSyncedAt: connection.last_synced_at,
      state: connectionState(connection.status, connection.last_synced_at),
    },
    isOutOfOffice: (events ?? []).some(
      (event) => event.event_type === "out_of_office" && event.is_all_day,
    ),
    meetings,
  };
}
