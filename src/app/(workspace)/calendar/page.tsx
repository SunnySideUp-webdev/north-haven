import type { Metadata } from "next";

import { FoundationPage } from "@/shared/ui/foundation-page";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <FoundationPage
      title="Calendar"
      description="A monthly record of what actually happened."
      sectionTitle="Work history, not another agenda"
      sectionBody="Daily summaries will be derived from confirmed work logs, outcomes, meetings, and important notes."
    />
  );
}
