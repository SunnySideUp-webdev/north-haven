import "server-only";

import { requireAuthenticatedContext } from "@/server/auth/session";
import { createAdminClient } from "@/server/database/supabase/admin";

export async function requireCalendarServerContext() {
  const { supabase, userId } = await requireAuthenticatedContext();
  const { data: workspaceId, error } = await supabase.rpc(
    "current_personal_workspace_id",
  );

  if (error || !workspaceId) throw new Error("Workspace not found.");
  return { admin: createAdminClient(), userId, workspaceId };
}
