import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  InsightsDashboard,
  InsightsPeriodControls,
} from "@/features/reporting/components/insights-dashboard";
import type { InsightsView } from "@/features/reporting/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const insights: InsightsView = {
  daily: [
    {
      completedItems: 3,
      dayNote: null,
      deferredItems: 0,
      hasImportantNote: false,
      isOutOfOffice: false,
      meetingsAttended: 1,
      planIntention: null,
      plannedItems: 4,
      planStatus: "closed",
      remindersCompleted: 1,
      returnedItems: 0,
      skippedItems: 0,
      tasksCompleted: 1,
      ticketsClosed: 1,
      ticketsResolved: 1,
      ticketsWorked: 2,
      workDate: "2026-08-03",
    },
  ],
  end: "2026-08-03",
  inventory: [
    {
      activeTickets: 8,
      age0To7: 2,
      age15To30: 2,
      age31Plus: 1,
      age8To14: 3,
      averageActiveAge: 16.5,
      ticketsReceived: 2,
      waitingTickets: 2,
      watchingTickets: 1,
      workDate: "2026-08-03",
    },
  ],
  isPartial: true,
  naturalEnd: "2026-08-31",
  period: "month",
  previousTotals: {
    completedItems: 2,
    meetingsAttended: 0,
    plannedItems: 3,
    remindersCompleted: 0,
    tasksCompleted: 0,
    ticketsClosed: 0,
    ticketsResolved: 0,
    ticketsWorked: 1,
  },
  start: "2026-08-01",
  timeZone: "America/Guatemala",
  today: "2026-08-03",
  totals: {
    completedItems: 3,
    meetingsAttended: 1,
    plannedItems: 4,
    remindersCompleted: 1,
    tasksCompleted: 1,
    ticketsClosed: 1,
    ticketsResolved: 1,
    ticketsWorked: 2,
  },
  workStatus: { active: 5, total: 8, waiting: 2, watching: 1 },
  workingWeekdays: [1, 2, 3, 4, 5],
};

describe("Insights", () => {
  beforeEach(() => push.mockClear());
  afterEach(cleanup);

  it("shows defined metrics, status snapshots, and accessible chart summaries", () => {
    render(<InsightsDashboard insights={insights} />);

    expect(screen.getByLabelText(/Tickets worked: 2/)).toHaveTextContent(
      "1 more than the previous period",
    );
    expect(screen.getByLabelText(/Active tickets: 8/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plan completion: 75%/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Weekly rhythm" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Work status: 8 active tickets total; 5 active, 1 watching, 2 waiting.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Active ticket inventory trend" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Average active ticket age was 16.5 days/),
    ).toBeInTheDocument();
  });

  it("changes periods without placing work content in the URL", () => {
    render(<InsightsPeriodControls insights={insights} />);

    fireEvent.change(screen.getByLabelText("Insights period"), {
      target: { value: "week" },
    });
    expect(push).toHaveBeenCalledWith(
      "/insights?period=week&anchor=2026-08-03",
    );
    expect(screen.getByRole("button", { name: "Export report" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Export report" }));
    expect(push).toHaveBeenLastCalledWith("/insights/reports");
    expect(window.sessionStorage.getItem("north-haven:report-entry")).toBe(
      JSON.stringify({ anchor: "2026-08-03", period: "monthly" }),
    );
  });
});
