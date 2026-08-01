import type { Metadata } from "next";

import { WorkItemForm } from "@/features/work-items/components/work-item-form";
import { todayInTimeZone } from "@/features/work-items/date";
import { getTicketTypes } from "@/features/work-items/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "New ticket" };

export default async function NewTicketPage() {
  const [{ profile }, ticketTypes] = await Promise.all([
    requireAuthenticatedContext(),
    getTicketTypes(),
  ]);

  return (
    <>
      <PageHeader
        title="New ticket"
        description="Capture only the context you will need to act and follow through."
      />
      <div className="mx-auto max-w-[920px] p-8">
        <WorkItemForm
          kind="ticket"
          ticketTypes={ticketTypes}
          defaultReceivedAt={todayInTimeZone(
            profile?.time_zone ?? "America/Guatemala",
          )}
        />
      </div>
    </>
  );
}
