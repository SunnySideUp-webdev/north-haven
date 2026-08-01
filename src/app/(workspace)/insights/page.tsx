import type { Metadata } from "next";

import {
  InsightsDashboard,
  InsightsPeriodControls,
} from "@/features/reporting/components/insights-dashboard";
import { getInsights } from "@/features/reporting/queries";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{
    anchor?: string;
    end?: string;
    period?: string;
    start?: string;
  }>;
}) {
  const request = await searchParams;
  const insights = await getInsights(request);

  return (
    <>
      <PageHeader
        title="Insights"
        description="See patterns in your work without turning the day into a score."
        action={
          <InsightsPeriodControls
            key={`${insights.period}-${insights.start}-${insights.end}`}
            insights={insights}
          />
        }
      />
      <InsightsDashboard insights={insights} />
    </>
  );
}
