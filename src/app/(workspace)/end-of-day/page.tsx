import type { Metadata } from "next";

import { EndOfDayFlow } from "@/features/daily-planning/components/end-of-day-flow";
import { getEndOfDayData } from "@/features/daily-planning/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";

export const metadata: Metadata = { title: "End of Day" };

export default async function EndOfDayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; step?: string }>;
}) {
  const [{ date, step }, { profile }] = await Promise.all([
    searchParams,
    requireAuthenticatedContext(),
  ]);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile?.time_zone ?? "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const workDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date! : today;
  const initialStep = Math.min(4, Math.max(1, Number(step) || 1));
  const data = await getEndOfDayData(workDate);
  return (
    <EndOfDayFlow data={data} initialStep={initialStep} workDate={workDate} />
  );
}
