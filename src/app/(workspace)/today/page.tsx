import type { Metadata } from "next";

import { DailyToday } from "@/features/daily-planning/components/daily-today";
import { getDailyPlanningData } from "@/features/daily-planning/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";

export const metadata: Metadata = { title: "Today" };

function localDate(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ date }, { profile }] = await Promise.all([
    searchParams,
    requireAuthenticatedContext(),
  ]);
  const requestedDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "")
    ? date!
    : localDate(profile?.time_zone ?? "America/Guatemala");
  const workDate = requestedDate;
  const data = await getDailyPlanningData(workDate);
  return <DailyToday data={data} workDate={workDate} />;
}
