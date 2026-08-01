"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { SettingsActionState } from "@/features/settings/types";
import {
  manualNonWorkingDayIdSchema,
  manualNonWorkingDaySchema,
  profileSettingsSchema,
  settingsPasswordSchema,
  workScheduleSettingsSchema,
} from "@/features/settings/validation";
import { requireAuthenticatedContext } from "@/server/auth/session";

function error(message: string): SettingsActionState {
  return { message, status: "error" };
}

export async function saveProfileSettingsAction(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const result = profileSettingsSchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!result.success)
    return error("Enter a display name up to 80 characters.");

  const { supabase } = await requireAuthenticatedContext();
  const { error: updateError } = await supabase.rpc("update_profile_settings", {
    chosen_display_name: result.data.displayName,
  });
  if (updateError) return error("We couldn't save your profile. Try again.");

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { message: "Profile saved.", status: "success" };
}

export async function saveWorkScheduleAction(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const result = workScheduleSettingsSchema.safeParse({
    endsAtLocal: formData.get("endsAtLocal"),
    startsAtLocal: formData.get("startsAtLocal"),
    timeZone: formData.get("timeZone"),
    workingWeekdays: formData.getAll("workingWeekdays"),
  });
  if (!result.success) {
    return error("Review your time zone, workdays, and working hours.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error: updateError } = await supabase.rpc(
    "update_work_schedule_settings",
    {
      chosen_ends_at_local: result.data.endsAtLocal,
      chosen_starts_at_local: result.data.startsAtLocal,
      chosen_time_zone: result.data.timeZone,
      chosen_working_weekdays: result.data.workingWeekdays,
    },
  );
  if (updateError) {
    return error("We couldn't save your work schedule. Try again.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { message: "Work schedule saved.", status: "success" };
}

async function ownerWorkspaceId() {
  const context = await requireAuthenticatedContext();
  const { data } = await context.supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("profile_id", context.userId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  return { ...context, workspaceId: data?.workspace_id };
}

export async function addManualNonWorkingDayAction(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const result = manualNonWorkingDaySchema.safeParse({
    kind: formData.get("kind"),
    workDate: formData.get("workDate"),
  });
  if (!result.success) return error("Choose a date and a day type.");

  const { supabase, workspaceId } = await ownerWorkspaceId();
  if (!workspaceId) return error("We couldn't find your personal workspace.");
  const { error: insertError } = await supabase
    .from("non_working_days")
    .insert({
      kind: result.data.kind,
      source: "manual",
      work_date: result.data.workDate,
      workspace_id: workspaceId,
    });
  if (insertError) {
    return error(
      insertError.message.includes("non_working_days_manual_unique_idx")
        ? "That non-working day already exists."
        : "We couldn't add this non-working day.",
    );
  }

  revalidatePath("/settings");
  revalidatePath("/plan");
  return { message: "Non-working day added.", status: "success" };
}

export async function removeManualNonWorkingDayAction(
  nonWorkingDayId: string,
): Promise<SettingsActionState> {
  const result = manualNonWorkingDayIdSchema.safeParse(nonWorkingDayId);
  if (!result.success) return error("We couldn't identify this day.");

  const { supabase } = await requireAuthenticatedContext();
  const { error: deleteError } = await supabase
    .from("non_working_days")
    .delete()
    .eq("id", result.data)
    .eq("source", "manual");
  if (deleteError) return error("We couldn't remove this day.");

  revalidatePath("/settings");
  revalidatePath("/plan");
  return { message: "Non-working day removed.", status: "success" };
}

export async function changeSettingsPasswordAction(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const result = settingsPasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password"),
  });
  if (!result.success) {
    return error("Use matching passwords with at least 12 characters.");
  }

  const { supabase } = await requireAuthenticatedContext();
  const { error: updateError } = await supabase.auth.updateUser({
    password: result.data.password,
  });
  if (updateError) return error("We couldn't update your password. Try again.");

  return { message: "Password updated.", status: "success" };
}

export async function signOutEverywhereAction(
  _previous: SettingsActionState,
  _formData: FormData,
): Promise<SettingsActionState> {
  void _previous;
  void _formData;
  const { supabase } = await requireAuthenticatedContext();
  const { error: signOutError } = await supabase.auth.signOut({
    scope: "global",
  });
  if (signOutError) {
    return error("We couldn't sign out every session. Try again.");
  }
  redirect("/sign-in");
}
