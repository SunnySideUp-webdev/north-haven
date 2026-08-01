import type { Metadata } from "next";

import { TicketTypeSettings } from "@/features/work-items/components/ticket-type-settings";
import { getManagedTicketTypes } from "@/features/work-items/queries";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Settings" };

const sections = [
  "Profile",
  "Work schedule",
  "Ticket types",
  "Calendar connection",
  "Data and privacy",
  "Security",
];

export default async function SettingsPage() {
  const ticketTypes = await getManagedTicketTypes();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Keep North Haven aligned with the way you work."
      />
      <div className="mx-auto grid max-w-[1200px] grid-cols-[220px_minmax(0,1fr)] gap-7 p-8">
        <aside className="border-border/70 bg-paper shadow-surface self-start rounded-xl border p-4">
          <p className="text-quiet px-3 pb-3 text-xs font-bold tracking-[0.12em] uppercase">
            Settings
          </p>
          <nav aria-label="Settings sections" className="space-y-1">
            {sections.map((section) => (
              <a
                key={section}
                href={
                  section === "Ticket types"
                    ? "#ticket-types"
                    : `#${section.toLowerCase().replaceAll(" ", "-")}`
                }
                className={`block rounded-lg px-3 py-3 text-sm font-bold ${section === "Ticket types" ? "bg-lavender-100 text-lavender-700" : "text-muted hover:bg-lavender-50 hover:text-ink"}`}
              >
                {section}
              </a>
            ))}
          </nav>
        </aside>
        <div className="space-y-7">
          <TicketTypeSettings ticketTypes={ticketTypes} />
          <section className="border-border/70 bg-paper rounded-xl border p-7">
            <h2 className="text-ink text-base font-bold">More settings</h2>
            <p className="text-muted mt-2 text-sm leading-6">
              Profile, schedule, calendar, privacy, and security controls remain
              protected by the existing setup and will be expanded in their
              planned phases.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
