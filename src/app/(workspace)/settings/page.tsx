import type { Metadata } from "next";

import { FoundationPage } from "@/shared/ui/foundation-page";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <FoundationPage
      title="Settings"
      description="Keep the planner aligned with your workday."
      sectionTitle="Connection settings are safely separated"
      sectionBody="Work schedule, privacy, account, and read-only Google Calendar configuration will live here."
    />
  );
}
