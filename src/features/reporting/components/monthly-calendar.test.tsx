import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MonthlyCalendar } from "@/features/reporting/components/monthly-calendar";
import type { MonthlyCalendarView } from "@/features/reporting/types";

const push = vi.fn();
const saveDayColor = vi.fn().mockResolvedValue({ ok: true });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

vi.mock("@/features/reporting/actions", () => ({
  saveCalendarDayColorAction: (...args: unknown[]) => saveDayColor(...args),
  saveMonthNoteAction: vi.fn().mockResolvedValue({ ok: true }),
}));

const calendar: MonthlyCalendarView = {
  currentMonth: "2026-08",
  dayColors: { "2026-08-04": "blush" },
  gridEnd: "2026-09-05",
  gridStart: "2026-07-26",
  monthEnd: "2026-08-31",
  monthKey: "2026-08",
  monthNote: "",
  monthStart: "2026-08-01",
  rows: [
    {
      completedItems: 0,
      dayNote: null,
      deferredItems: 0,
      hasImportantNote: false,
      isOutOfOffice: false,
      meetingsAttended: 0,
      planIntention: "Prepare the oldest requests.",
      plannedItems: 4,
      planStatus: "ready",
      remindersCompleted: 0,
      returnedItems: 0,
      skippedItems: 0,
      tasksCompleted: 0,
      ticketsClosed: 0,
      ticketsResolved: 0,
      ticketsWorked: 0,
      workDate: "2026-08-03",
    },
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
    {
      completedItems: 0,
      dayNote: null,
      deferredItems: 0,
      hasImportantNote: false,
      isOutOfOffice: true,
      meetingsAttended: 0,
      planIntention: null,
      plannedItems: 0,
      planStatus: null,
      remindersCompleted: 0,
      returnedItems: 0,
      skippedItems: 0,
      tasksCompleted: 0,
      ticketsClosed: 0,
      ticketsResolved: 0,
      ticketsWorked: 0,
      workDate: "2026-08-05",
    },
  ],
  timeZone: "America/Guatemala",
  today: "2026-08-04",
};

describe("MonthlyCalendar", () => {
  beforeEach(() => {
    push.mockClear();
    saveDayColor.mockClear();
  });
  afterEach(cleanup);

  it("shows retrospective metrics and a selected Day Summary", () => {
    render(<MonthlyCalendar calendar={calendar} googleConnected />);

    expect(screen.getByText("3 worked")).toBeInTheDocument();
    expect(screen.getByText("1 resolved")).toBeInTheDocument();
    expect(screen.getAllByText("6 planned")).toHaveLength(1);
    expect(screen.getAllByText("2 meetings attended")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Tuesday, August 4, 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/6 planned ·/)).toHaveTextContent(
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

  it("shows a planned-only day inside its calendar cell", () => {
    render(<MonthlyCalendar calendar={calendar} googleConnected />);

    expect(screen.getByText("4 planned")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Open summary for Monday, August 3, 2026",
      }),
    );
    expect(
      screen.getByText(
        "This day is planned, but no work has been completed yet.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/4 planned ·/)).toHaveTextContent(
      "4 planned · 0 completed",
    );
  });

  it("uses the soft OOO surface from the planner palette", () => {
    render(<MonthlyCalendar calendar={calendar} googleConnected />);

    expect(
      screen.getByRole("button", {
        name: "Open summary for Wednesday, August 5, 2026",
      }).parentElement,
    ).toHaveClass("bg-[#DDD5E6]");
    expect(screen.getByText("OOO")).toHaveClass("text-[#5f526d]");
  });

  it("changes month without putting work content in the URL", () => {
    render(<MonthlyCalendar calendar={calendar} googleConnected />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(push).toHaveBeenCalledWith("/calendar?month=2026-09");
  });

  it("saves a palette color from the hover action", async () => {
    render(<MonthlyCalendar calendar={calendar} googleConnected />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Customize Tuesday, August 4, 2026",
      }),
    );
    expect(
      screen.getByRole("dialog", {
        name: "Day color for Tuesday, August 4, 2026",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Use Sage for Tuesday, August 4, 2026",
      }),
    );
    await waitFor(() =>
      expect(saveDayColor).toHaveBeenCalledWith({
        color: "sage",
        workDate: "2026-08-04",
      }),
    );
  });

  it("keeps edge color menus inside the calendar grid", () => {
    render(<MonthlyCalendar calendar={calendar} googleConnected />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Customize Saturday, August 1, 2026",
      }),
    );

    expect(
      screen.getByRole("dialog", {
        name: "Day color for Saturday, August 1, 2026",
      }),
    ).toHaveClass("right-2");
  });
});
