import type { Metadata } from "next";

import { TodayView } from "@/features/daily-planning/components/today-view";
import { foundationPlan } from "@/features/daily-planning/data/foundation-plan";

export const metadata: Metadata = {
  title: "Today",
};

export default function TodayPage() {
  return <TodayView plan={foundationPlan} />;
}
