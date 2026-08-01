import type { Metadata } from "next";

import { FoundationPage } from "@/shared/ui/foundation-page";

export const metadata: Metadata = { title: "Work" };

export default function WorkPage() {
  return (
    <FoundationPage
      title="Work inventory"
      description="Everything exists here. Only selected items appear in Today."
      sectionTitle="Tickets, tasks, and reminders belong here"
      sectionBody="The inventory module will keep normal tasks distinct from tickets while letting both participate in a daily plan."
    />
  );
}
