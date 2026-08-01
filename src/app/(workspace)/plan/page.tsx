import type { Metadata } from "next";

import { PlanBuilder } from "@/features/daily-planning/components/plan-builder";
import { getDailyPlanningData } from "@/features/daily-planning/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";

export const metadata: Metadata = { title: "Plan" };

function localDate(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function PlanPage({
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
  const data = await getDailyPlanningData(requestedDate);
  return <PlanBuilder data={data} workDate={requestedDate} />;
}
