import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MonthlyCalendar } from "@/features/reporting/components/monthly-calendar";
import type { MonthlyCalendarView } from "@/features/reporting/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

vi.mock("@/features/reporting/actions", () => ({
  saveMonthNoteAction: vi.fn().mockResolvedValue({ ok: true }),
}));

const calendar: MonthlyCalendarView = {
  currentMonth: "2026-08",
  gridEnd: "2026-09-05",
  gridStart: "2026-07-26",
  monthEnd: "2026-08-31",
  monthKey: "2026-08",
  monthNote: "",
  monthStart: "2026-08-01",
  rows: [
    {
      completedItems: 5,
      dayNote: "Confirmed the downstream changes.",
      deferredItems: 1,
      hasImportantNote: true,
      isOutOfOffice: false,
      meetingsAttended: 2,
      planIntention: "Finish the oldest requests first.",
      plannedItems: 6,
      planStatus: "closed",
      remindersCompleted: 0,
      returnedItems: 0,
      skippedItems: 0,
      tasksCompleted: 1,
      ticketsClosed: 1,
      ticketsResolved: 1,
      ticketsWorked: 3,
      workDate: "2026-08-04",
    },
  ],
  timeZone: "America/Guatemala",
  today: "2026-08-04",
};

describe("MonthlyCalendar", () => {
  beforeEach(() => push.mockClear());
  afterEach(cleanup);

  it("shows retrospective metrics and a selected Day Summary", () => {
    render(<MonthlyCalendar calendar={calendar} googleConnected />);

    expect(screen.getByText("3 worked")).toBeInTheDocument();
    expect(screen.getByText("1 resolved")).toBeInTheDocument();
    expect(screen.getAllByText("2 meetings attended")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Tuesday, August 4, 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/6 planned/)).toHaveTextContent(
      "6 planned · 5 completed",
    );
    expect(
      screen.getByText("Confirmed the downstream changes."),
    ).toBeInTheDocument();
  });

  it("hides a metric without losing the selected summary", () => {
    render(<MonthlyCalendar calendar={calendar} googleConnected />);

    fireEvent.click(screen.getByRole("checkbox", { name: "worked" }));
    expect(screen.queryByText("3 worked")).not.toBeInTheDocument();
    expect(screen.getByText("3 tickets worked")).toBeInTheDocument();
  });

  it("changes month without putting work content in the URL", () => {
    render(<MonthlyCalendar calendar={calendar} googleConnected />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(push).toHaveBeenCalledWith("/calendar?month=2026-09");
  });
});
