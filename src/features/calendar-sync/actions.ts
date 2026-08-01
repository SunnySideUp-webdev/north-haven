"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCalendarServerContext } from "@/features/calendar-sync/server-context";
import {
  disconnectGoogleCalendar,
  setCalendarSelected,
  syncGoogleCalendar,
} from "@/features/calendar-sync/sync";

export type CalendarActionResult = { ok: boolean; message?: string };

function refreshCalendarViews() {
  revalidatePath("/settings");
  revalidatePath("/today");
  revalidatePath("/plan");
  revalidatePath("/calendar");
  revalidatePath("/end-of-day");
}

export async function syncCalendarAction(): Promise<CalendarActionResult> {
  try {
    const { workspaceId } = await requireCalendarServerContext();
    await syncGoogleCalendar(workspaceId);
    refreshCalendarViews();
    return { ok: true, message: "Google Calendar is up to date." };
  } catch {
    return {
      ok: false,
      message:
        "North Haven could not sync Google Calendar. Your work plan is still available.",
    };
  }
}

const calendarSelectionSchema = z.object({
  calendarId: z.string().uuid(),
  selected: z.boolean(),
});

export async function setCalendarSelectedAction(
  input: z.input<typeof calendarSelectionSchema>,
): Promise<CalendarActionResult> {
  const parsed = calendarSelectionSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Invalid calendar selection." };
  try {
    await setCalendarSelected(parsed.data.calendarId, parsed.data.selected);
    refreshCalendarViews();
    return { ok: true, message: "Calendar selection saved." };
  } catch {
    return { ok: false, message: "Calendar selection could not be saved." };
  }
}

export async function disconnectCalendarAction(): Promise<CalendarActionResult> {
  try {
    await disconnectGoogleCalendar();
    refreshCalendarViews();
    return { ok: true, message: "Google Calendar disconnected." };
  } catch {
    return { ok: false, message: "Google Calendar could not be disconnected." };
  }
}

const meetingOutcomeSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["attended", "cancelled", "did_not_attend", "not_applicable"]),
});

export async function saveMeetingOutcomeAction(
  input: z.input<typeof meetingOutcomeSchema>,
): Promise<CalendarActionResult> {
  const parsed = meetingOutcomeSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Invalid meeting outcome." };

  try {
    const { admin, workspaceId } = await requireCalendarServerContext();
    const { data: event } = await admin
      .from("external_calendar_events")
      .select("id")
      .eq("id", parsed.data.eventId)
      .eq("workspace_id", workspaceId)
      .eq("event_type", "default")
      .maybeSingle();
    if (!event) throw new Error("Meeting not found.");

    const { error } = await admin.from("meeting_outcomes").upsert(
      {
        attendance_status: parsed.data.status,
        confirmed_at: new Date().toISOString(),
        external_calendar_event_id: event.id,
        workspace_id: workspaceId,
      },
      { onConflict: "external_calendar_event_id" },
    );
    if (error) throw new Error("Meeting outcome could not be saved.");
    refreshCalendarViews();
    return { ok: true };
  } catch {
    return { ok: false, message: "Meeting outcome could not be saved." };
  }
}
