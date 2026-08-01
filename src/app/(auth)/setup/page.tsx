import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFrame } from "@/features/auth/components/auth-frame";
import { SetupForm } from "@/features/auth/components/setup-form";
import { requireAuthenticatedContext } from "@/server/auth/session";

export const metadata: Metadata = { title: "Set up your workday" };

export default async function SetupPage() {
  const { profile, supabase, userId } = await requireAuthenticatedContext();

  if (profile?.setup_completed_at) {
    redirect("/today");
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("profile_id", userId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  const { data: schedule } = membership
    ? await supabase
        .from("work_schedules")
        .select("working_weekdays, starts_at_local, ends_at_local, time_zone")
        .eq("workspace_id", membership.workspace_id)
        .maybeSingle()
    : { data: null };

  return (
    <AuthFrame
      title="Set up your workday"
      description="A few calm defaults will help North Haven prepare the right day for you."
    >
      <SetupForm
        defaults={{
          displayName: profile?.display_name ?? "",
          endsAtLocal: schedule?.ends_at_local.slice(0, 5) ?? "17:00",
          startsAtLocal: schedule?.starts_at_local.slice(0, 5) ?? "08:00",
          timeZone:
            schedule?.time_zone ?? profile?.time_zone ?? "America/Guatemala",
          workingWeekdays: schedule?.working_weekdays ?? [1, 2, 3, 4, 5],
        }}
      />
    </AuthFrame>
  );
}
