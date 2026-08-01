import type { Metadata } from "next";

import { FoundationPage } from "@/shared/ui/foundation-page";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return (
    <FoundationPage
      title="Plan"
      description="Choose the work that deserves your attention next."
      sectionTitle="Your next workday will appear here"
      sectionBody="Manual selection, workday rules, and calm capacity guidance are prepared for the daily-planning build."
    />
  );
}
