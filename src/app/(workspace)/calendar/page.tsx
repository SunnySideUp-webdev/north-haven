import type { Metadata } from "next";
import Link from "next/link";

import { getCalendarSettings } from "@/features/calendar-sync/queries";
import { MonthlyCalendar } from "@/features/reporting/components/monthly-calendar";
import { getMonthlyCalendar } from "@/features/reporting/queries";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const [settings, calendar] = await Promise.all([
    getCalendarSettings(),
    getMonthlyCalendar(month),
  ]);
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${calendar.monthStart}T12:00:00Z`));

  return (
    <>
      <PageHeader
        title={monthLabel}
        description="A monthly record of actual work."
        action={
          <Link
            href="/settings#calendar-connection"
            className="border-border bg-paper text-muted rounded-lg border px-5 py-3 text-sm font-bold"
          >
            Manage connection
          </Link>
        }
      />
      <MonthlyCalendar
        calendar={calendar}
        googleConnected={Boolean(settings.connection)}
      />
    </>
  );
}
