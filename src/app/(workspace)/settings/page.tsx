import type { Metadata } from "next";

import { getCalendarSettings } from "@/features/calendar-sync/queries";
import { SettingsDashboard } from "@/features/settings/components/settings-dashboard";
import { getSettingsOverview } from "@/features/settings/queries";
import { getManagedTicketTypes } from "@/features/work-items/queries";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string }>;
}) {
  const [{ calendar }, ticketTypes, calendarSettings, overview] =
    await Promise.all([
      searchParams,
      getManagedTicketTypes(),
      getCalendarSettings(),
      getSettingsOverview(),
    ]);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Keep North Haven aligned with the way you work."
      />
      <SettingsDashboard
        calendarResult={calendar}
        calendarSettings={calendarSettings}
        overview={overview}
        ticketTypes={ticketTypes}
      />
    </>
  );
}
