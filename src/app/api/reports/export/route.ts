import { renderToStream } from "@react-pdf/renderer";
import { createElement } from "react";
import { Readable } from "node:stream";

import { reportToCsv } from "@/features/reporting/export/csv";
import { ReportPdfDocument } from "@/features/reporting/export/pdf-document";
import { getReport } from "@/features/reporting/queries";
import {
  reportConfigSchema,
  reportFilename,
} from "@/features/reporting/reports";
import { getAuthContext } from "@/server/auth/session";
import {
  isSameOriginReportRequest,
  privateReportHeaders,
} from "@/server/security/report-export";

export const runtime = "nodejs";
export const maxDuration = 60;

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { headers: privateReportHeaders, status });
}

export async function POST(request: Request) {
  if (!isSameOriginReportRequest(request)) {
    return errorResponse("This report request was not accepted.", 403);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return errorResponse("The report request is too large.", 413);
  }

  const { supabase, userId } = await getAuthContext();
  if (!userId) return errorResponse("Sign in to export a report.", 401);
  const { data: allowed, error: limitError } = await supabase.rpc(
    "claim_report_export_slot",
  );
  if (limitError) {
    return errorResponse("Report generation is temporarily unavailable.", 503);
  }
  if (!allowed) {
    return errorResponse(
      "Please wait a moment before generating another report.",
      429,
    );
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return errorResponse("Review the report settings.", 400);
  }
  const parsed = reportConfigSchema.safeParse(input);
  if (!parsed.success) {
    return errorResponse("Review the report settings.", 400);
  }

  try {
    const report = await getReport(parsed.data);
    if (!report.hasData) {
      return errorResponse(
        "There is not enough activity for this period.",
        422,
      );
    }
    const filename = reportFilename(
      report.config.period,
      report.start,
      report.end,
      report.config.format,
    );
    const commonHeaders = {
      ...privateReportHeaders,
      "Content-Disposition": `attachment; filename="${filename}"`,
    };

    if (report.config.format === "csv") {
      return new Response(reportToCsv(report), {
        headers: {
          ...commonHeaders,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    const nodeStream = await renderToStream(
      createElement(ReportPdfDocument, { report }) as Parameters<
        typeof renderToStream
      >[0],
    );
    const stream = Readable.toWeb(nodeStream as Readable) as ReadableStream;
    return new Response(stream, {
      headers: { ...commonHeaders, "Content-Type": "application/pdf" },
    });
  } catch {
    return errorResponse(
      "We couldn't create this report. Your settings are still here.",
      500,
    );
  }
}
