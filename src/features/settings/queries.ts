import "server-only";

import { requireAuthenticatedContext } from "@/server/auth/session";
import type { SettingsOverview } from "@/features/settings/types";

function localDate(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).format(new Date());
}

export async function getSettingsOverview(): Promise<SettingsOverview> {
  const { profile, supabase, userId } = await requireAuthenticatedContext();
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("profile_id", userId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("We couldn't load your personal workspace settings.");
  }

  const timeZone = profile?.time_zone ?? "America/Guatemala";
  const today = localDate(timeZone);
  const [{ data: userData }, { data: schedule, error: scheduleError }, days] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("work_schedules")
        .select("working_weekdays, starts_at_local, ends_at_local, time_zone")
        .eq("workspace_id", membership.workspace_id)
        .maybeSingle(),
      supabase
        .from("non_working_days")
        .select("id, work_date, kind")
        .eq("workspace_id", membership.workspace_id)
        .eq("source", "manual")
        .gte("work_date", today)
        .order("work_date"),
    ]);

  if (scheduleError || !schedule || days.error) {
    throw new Error("We couldn't load your work schedule settings.");
  }

  return {
    email: userData.user?.email ?? "",
    manualNonWorkingDays: days.data.map((day) => ({
      id: day.id,
      kind: day.kind === "holiday" ? "holiday" : "manual",
      workDate: day.work_date,
    })),
    profile: {
      displayName: profile?.display_name ?? "",
      timeZone,
    },
    schedule: {
      endsAtLocal: schedule.ends_at_local.slice(0, 5),
      startsAtLocal: schedule.starts_at_local.slice(0, 5),
      timeZone: schedule.time_zone,
      workingWeekdays: schedule.working_weekdays,
    },
    today,
  };
}
