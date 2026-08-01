"use client";

import { useEffect, useState } from "react";

import { CalendarConnectionSettings } from "@/features/calendar-sync/components/calendar-connection-settings";
import type { CalendarSettingsView } from "@/features/calendar-sync/types";
import { DataPrivacySettings } from "@/features/settings/components/data-privacy-settings";
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
        {active === "data-and-privacy" ? <DataPrivacySettings /> : null}
        {active === "security" ? (
          <SecuritySettings email={overview.email} />
        ) : null}
      </div>
    </div>
  );
}
