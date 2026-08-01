import type { Metadata } from "next";

import { DailyToday } from "@/features/daily-planning/components/daily-today";
import { getDailyPlanningData } from "@/features/daily-planning/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const { profile } = await requireAuthenticatedContext();
  const workDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile?.time_zone ?? "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const data = await getDailyPlanningData(workDate);
  return <DailyToday data={data} workDate={workDate} />;
}
