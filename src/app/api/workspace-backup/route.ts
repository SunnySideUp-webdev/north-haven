import { revalidatePath } from "next/cache";

import {
  restoreWorkspaceRequestSchema,
  workspaceBackupFilename,
  workspaceBackupSchema,
} from "@/features/settings/workspace-backup";
import { getAuthContext } from "@/server/auth/session";
import {
  isSameOriginReportRequest,
  privateReportHeaders,
} from "@/server/security/report-export";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { headers: privateReportHeaders, status });
}

export async function GET(request: Request) {
  if (!isSameOriginReportRequest(request)) {
    return errorResponse("This backup request was not accepted.", 403);
  }
  const { supabase, userId } = await getAuthContext();
  if (!userId) return errorResponse("Sign in to download a backup.", 401);

  const { data, error } = await supabase.rpc("create_workspace_backup");
  const parsed = workspaceBackupSchema.safeParse(data);
  if (error || !parsed.success) {
    return errorResponse("We couldn't create your workspace backup.", 500);
  }

  return new Response(JSON.stringify(parsed.data, null, 2), {
    headers: {
      ...privateReportHeaders,
      "Content-Disposition": `attachment; filename="${workspaceBackupFilename(parsed.data.exported_at)}"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginReportRequest(request)) {
    return errorResponse("This restore request was not accepted.", 403);
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 10_600_000) {
    return errorResponse("The workspace backup is larger than 10 MB.", 413);
  }

  const { supabase, userId } = await getAuthContext();
  if (!userId) return errorResponse("Sign in to restore a backup.", 401);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return errorResponse("Choose a valid North Haven backup file.", 400);
  }
  const parsed = restoreWorkspaceRequestSchema.safeParse(input);
  if (!parsed.success) {
    return errorResponse(
      "Choose a valid North Haven backup and confirm the restore.",
      400,
    );
  }

  const { data, error } = await supabase.rpc("restore_workspace_backup", {
    chosen_backup: parsed.data.backup,
    chosen_confirmation: parsed.data.confirmation,
  });
  if (error) {
    return errorResponse(
      "We couldn't restore this backup. Your current workspace was not changed.",
      422,
    );
  }

  revalidatePath("/", "layout");
  return Response.json(data, { headers: privateReportHeaders });
}
