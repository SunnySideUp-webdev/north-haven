import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsDashboard } from "@/features/settings/components/settings-dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/settings/actions", () => ({
  addManualNonWorkingDayAction: vi.fn(),
  changeSettingsPasswordAction: vi.fn(),
  removeManualNonWorkingDayAction: vi.fn(),
  saveProfileSettingsAction: vi.fn(),
  saveWorkScheduleAction: vi.fn(),
  signOutEverywhereAction: vi.fn(),
}));

vi.mock("@/features/calendar-sync/actions", () => ({
  disconnectCalendarAction: vi.fn(),
  setCalendarSelectedAction: vi.fn(),
  syncCalendarAction: vi.fn(),
}));

vi.mock("@/features/work-items/actions", () => ({
  createTicketTypeAction: vi.fn(),
  manageTicketTypeAction: vi.fn(),
}));

const overview = {
  email: "sunny@example.com",
  manualNonWorkingDays: [],
  profile: { displayName: "Sunny", timeZone: "America/Guatemala" },
  schedule: {
    endsAtLocal: "17:00",
    startsAtLocal: "08:00",
    timeZone: "America/Guatemala",
    workingWeekdays: [1, 2, 3, 4, 5],
  },
  today: "2026-08-01",
};

describe("SettingsDashboard", () => {
  afterEach(cleanup);

  it("opens Profile by default and keeps the active navigation accurate", () => {
    render(
      <SettingsDashboard
        calendarSettings={{ configured: true, connection: null }}
        overview={overview}
        ticketTypes={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Profile" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    fireEvent.click(screen.getByRole("link", { name: "Work schedule" }));
    expect(
      screen.getByRole("heading", { name: "Work schedule" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Work schedule" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows Calendar after an OAuth result and exposes workspace recovery", () => {
    const { rerender } = render(
      <SettingsDashboard
        calendarResult="connected"
        calendarSettings={{ configured: true, connection: null }}
        overview={overview}
        ticketTypes={[]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Google Calendar" }),
    ).toBeVisible();

    rerender(
      <SettingsDashboard
        calendarSettings={{ configured: true, connection: null }}
        overview={overview}
        ticketTypes={[]}
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: "Data and privacy" }));
    expect(
      screen.getByRole("button", { name: "Download workspace backup" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Restore workspace" }),
    ).toBeVisible();
  });
});
