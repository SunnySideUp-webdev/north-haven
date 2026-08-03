import type { Metadata } from "next";

import { WorkItemForm } from "@/features/work-items/components/work-item-form";
import { todayInTimeZone } from "@/features/work-items/date";
import { getTicketTypes, getWorkItem } from "@/features/work-items/queries";
import { requireAuthenticatedContext } from "@/server/auth/session";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Edit work" };

export default async function EditWorkItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const [item, { profile }] = await Promise.all([
    getWorkItem(id),
    requireAuthenticatedContext(),
  ]);
  const ticketTypes = item.kind === "ticket" ? await getTicketTypes() : [];

  return (
    <>
      <PageHeader
        backLink={{
          href: from === "today" ? `/work/${id}?from=today` : `/work/${id}`,
          label: "Work item",
        }}
        title={`Edit ${item.kind}`}
        description="Keep the record current without losing its history."
      />
      <div className="mx-auto max-w-[920px] p-8">
        <WorkItemForm
          kind={item.kind!}
          item={item}
          ticketTypes={ticketTypes}
          defaultReceivedAt={todayInTimeZone(
            profile?.time_zone ?? "America/Guatemala",
          )}
        />
      </div>
    </>
  );
}
