"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CalendarConnectionSettings } from "@/features/calendar-sync/components/calendar-connection-settings";
import type { CalendarSettingsView } from "@/features/calendar-sync/types";
import { ProfileSettings } from "@/features/settings/components/profile-settings";
import { SecuritySettings } from "@/features/settings/components/security-settings";
import { WorkScheduleSettings } from "@/features/settings/components/work-schedule-settings";
import type { SettingsOverview } from "@/features/settings/types";
import { TicketTypeSettings } from "@/features/work-items/components/ticket-type-settings";
import type { ManagedTicketType } from "@/features/work-items/types";

const sections = [
  { id: "profile", label: "Profile" },
  { id: "work-schedule", label: "Work schedule" },
  { id: "ticket-types", label: "Ticket types" },
  { id: "calendar-connection", label: "Calendar connection" },
  { id: "data-and-privacy", label: "Data and privacy" },
  { id: "security", label: "Security" },
] as const;

type SectionId = (typeof sections)[number]["id"];

function isSectionId(value: string): value is SectionId {
  return sections.some((section) => section.id === value);
}

function DataAndPrivacySettings() {
  return (
    <section
      id="data-and-privacy"
      className="border-border/70 bg-paper shadow-surface rounded-xl border p-8"
    >
      <p className="text-blush-600 text-xs font-bold tracking-[0.12em] uppercase">
        Private by default
      </p>
      <h2 className="text-ink mt-2 text-xl font-bold">Data and privacy</h2>
      <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
        North Haven stores only the work information you choose to enter.
        Generated reports are streamed to your browser and are not retained by
        the application.
      </p>

      <div className="bg-lavender-50 mt-7 rounded-xl p-6">
        <h3 className="text-ink text-base font-bold">Report privacy</h3>
        <p className="text-muted mt-2 text-sm leading-6">
          Ticket titles, day notes, and follow-up reasons remain excluded until
          you explicitly include them in a report.
        </p>
        <Link
          href="/insights/reports"
          className="text-lavender-700 mt-4 inline-block text-sm font-bold"
        >
          Open Report Builder →
        </Link>
      </div>

      <div className="border-border mt-8 border-t pt-7">
        <h3 className="text-ink text-base font-bold">Workspace recovery</h3>
        <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
          A complete workspace backup and verified restoration tool will be
          added before personal launch. Reports are summaries and should not be
          treated as backups.
        </p>
      </div>
    </section>
  );
}

export function SettingsDashboard({
  calendarResult,
  calendarSettings,
  overview,
  ticketTypes,
}: {
  calendarResult?: string;
  calendarSettings: CalendarSettingsView;
  overview: SettingsOverview;
  ticketTypes: ManagedTicketType[];
}) {
  const [active, setActive] = useState<SectionId>(
    calendarResult ? "calendar-connection" : "profile",
  );

  useEffect(() => {
    function readHash() {
      const hash = window.location.hash.slice(1);
      if (isSectionId(hash)) setActive(hash);
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-[220px_minmax(0,1fr)] gap-7 p-8">
      <aside className="border-border/70 bg-paper shadow-surface self-start rounded-xl border p-4">
        <p className="text-quiet px-3 pb-3 text-xs font-bold tracking-[0.12em] uppercase">
          Settings
        </p>
        <nav aria-label="Settings sections" className="space-y-1">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? "page" : undefined}
              onClick={() => setActive(section.id)}
              className={`block rounded-lg px-3 py-3 text-sm font-bold ${active === section.id ? "bg-lavender-100 text-lavender-700" : "text-muted hover:bg-lavender-50 hover:text-ink"}`}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </aside>

      <div>
        {active === "profile" ? (
          <ProfileSettings
            displayName={overview.profile.displayName}
            email={overview.email}
          />
        ) : null}
        {active === "work-schedule" ? (
          <WorkScheduleSettings
            manualNonWorkingDays={overview.manualNonWorkingDays}
            schedule={overview.schedule}
            today={overview.today}
          />
        ) : null}
        {active === "ticket-types" ? (
          <TicketTypeSettings ticketTypes={ticketTypes} />
        ) : null}
        {active === "calendar-connection" ? (
          <CalendarConnectionSettings
            resultCode={calendarResult}
            settings={calendarSettings}
          />
        ) : null}
        {active === "data-and-privacy" ? <DataAndPrivacySettings /> : null}
        {active === "security" ? (
          <SecuritySettings email={overview.email} />
        ) : null}
      </div>
    </div>
  );
}
