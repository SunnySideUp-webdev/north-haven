"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getMonthRange } from "@/features/reporting/date";
import { requireAuthenticatedContext } from "@/server/auth/session";

export type ReportingActionResult = { message?: string; ok: boolean };

export async function saveMonthNoteAction(input: {
  body: string;
  monthKey: string;
}): Promise<ReportingActionResult> {
  const result = z
    .object({
      body: z.string().trim().max(10_000),
      monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    })
    .safeParse(input);
  if (!result.success)
    return { message: "Review the monthly note.", ok: false };

  const { supabase } = await requireAuthenticatedContext();
  const { data: workspaceId, error: workspaceError } = await supabase.rpc(
    "current_personal_workspace_id",
  );
  if (workspaceError || !workspaceId) {
    return { message: "We couldn't find your workspace.", ok: false };
  }

  const monthStart = getMonthRange(result.data.monthKey).monthStart;
  const operation = result.data.body
    ? supabase.from("month_notes").upsert(
        {
          body: result.data.body,
          month_start: monthStart,
          workspace_id: workspaceId,
        },
        { onConflict: "workspace_id,month_start" },
      )
    : supabase
        .from("month_notes")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("month_start", monthStart);
  const { error } = await operation;
  if (error)
    return { message: "We couldn't save the monthly note.", ok: false };

  revalidatePath("/calendar");
  return { message: "Monthly note saved.", ok: true };
}
