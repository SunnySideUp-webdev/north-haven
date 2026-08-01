import type { Metadata } from "next";

import { FoundationPage } from "@/shared/ui/foundation-page";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <FoundationPage
      title="Insights"
      description="See patterns in your work without turning the day into a score."
      sectionTitle="Shared metrics are ready for implementation"
      sectionBody="Calendar, Insights, and Reports will use one reporting layer so identical periods always match."
      actionLabel="Export report"
    />
  );
}
