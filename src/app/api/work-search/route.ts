import { z } from "zod";

import { getAuthContext } from "@/server/auth/session";
import {
  isSameOriginReportRequest,
  privateReportHeaders,
} from "@/server/security/report-export";

const requestSchema = z.object({
  includeArchived: z.boolean().default(false),
  query: z.string().trim().min(2).max(120),
});

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { headers: privateReportHeaders, status });
}

export async function POST(request: Request) {
  if (!isSameOriginReportRequest(request))
    return errorResponse("This search request was not accepted.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > 2_000)
    return errorResponse("This search request is too large.", 413);

  const { supabase, userId } = await getAuthContext();
  if (!userId) return errorResponse("Sign in to search your workspace.", 401);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return errorResponse("Enter a valid search.", 400);
  }

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success)
    return errorResponse("Enter at least two characters.", 400);

  const { data, error } = await supabase.rpc("global_work_search", {
    chosen_include_archived: parsed.data.includeArchived,
    chosen_query: parsed.data.query,
  });
  if (error) return errorResponse("We couldn't search your workspace.", 500);

  return Response.json({ results: data }, { headers: privateReportHeaders });
}
