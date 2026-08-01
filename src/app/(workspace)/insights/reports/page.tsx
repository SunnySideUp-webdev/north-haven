import type { Metadata } from "next";
import Link from "next/link";

import { ReportBuilder } from "@/features/reporting/components/report-builder";
import { getInitialReport } from "@/features/reporting/queries";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Export report" };

export default async function ReportBuilderPage() {
  const report = await getInitialReport();

  return (
    <>
      <PageHeader
        title="Export report"
        description="Create a calm, shareable summary from the same data as Insights."
        action={
          <Link
            href="/insights"
            className="text-lavender-700 hover:text-lavender-500 text-sm font-bold"
          >
            Back to Insights
          </Link>
        }
      />
      <ReportBuilder initialReport={report} />
    </>
  );
}
