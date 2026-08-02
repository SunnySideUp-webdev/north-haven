import type { Metadata } from "next";

import { WorkItemForm } from "@/features/work-items/components/work-item-form";
import { todayInTimeZone } from "@/features/work-items/date";
import { requireAuthenticatedContext } from "@/server/auth/session";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "New reminder" };

export default async function NewReminderPage() {
  const { profile } = await requireAuthenticatedContext();

  return (
    <>
      <PageHeader
        backLink={{ href: "/work", label: "Work inventory" }}
        title="New reminder"
        description="Save a small prompt now so your future self does not have to remember it."
      />
      <div className="mx-auto max-w-[920px] p-8">
        <WorkItemForm
          kind="reminder"
          defaultReceivedAt={todayInTimeZone(
            profile?.time_zone ?? "America/Guatemala",
          )}
        />
      </div>
    </>
  );
}
