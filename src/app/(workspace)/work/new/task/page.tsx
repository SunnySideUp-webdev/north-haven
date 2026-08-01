import type { Metadata } from "next";

import { WorkItemForm } from "@/features/work-items/components/work-item-form";
import { todayInTimeZone } from "@/features/work-items/date";
import { requireAuthenticatedContext } from "@/server/auth/session";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "New task" };

export default async function NewTaskPage() {
  const { profile } = await requireAuthenticatedContext();

  return (
    <>
      <PageHeader
        title="New task"
        description="Keep normal work distinct from tickets while planning both in one place."
      />
      <div className="mx-auto max-w-[920px] p-8">
        <WorkItemForm
          kind="task"
          defaultReceivedAt={todayInTimeZone(
            profile?.time_zone ?? "America/Guatemala",
          )}
        />
      </div>
    </>
  );
}
