import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReportBuilder } from "@/features/reporting/components/report-builder";
import { reportFixture } from "@/test/report-fixture";

vi.mock("@/features/reporting/actions", () => ({
  loadReportPreviewAction: vi.fn(async (config) => ({
    ok: true,
    report: reportFixture({ config }),
  })),
}));

describe("Report Builder", () => {
  afterEach(cleanup);

  it("starts privacy-safe and shows the designed preview", () => {
    render(<ReportBuilder initialReport={reportFixture()} />);
    expect(
      screen.getByRole("heading", { name: "Weekly work summary" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Resolution outcome by day" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Not resolved").length).toBeGreaterThan(0);
    expect(screen.getByText("PDF · selectable text")).toBeInTheDocument();
    expect(
      screen.queryByText("This report may contain customer information."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate PDF" })).toBeEnabled();
  });

  it("warns before details and offers the accessible CSV preview", async () => {
    render(<ReportBuilder initialReport={reportFixture()} />);
    fireEvent.click(screen.getByLabelText(/Ticket and task titles/));
    expect(
      screen.getByText("This report may contain customer information."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Data CSV" }));
    expect(
      screen.getByRole("heading", { name: "One row per date" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Download CSV" }),
      ).toBeEnabled(),
    );
  });

  it("shows selected detail sections even when the period has no matching rows", () => {
    render(<ReportBuilder initialReport={reportFixture()} />);

    fireEvent.click(screen.getByLabelText(/Ticket and task titles/));
    fireEvent.click(screen.getByLabelText(/Day notes/));
    fireEvent.click(screen.getByLabelText(/Follow-up reasons/));

    expect(screen.getByRole("heading", { name: "Tickets and tasks worked" }));
    expect(
      screen.getByText("No tickets or tasks matched this report period."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Day notes" }));
    expect(
      screen.getByText("No day notes were recorded for this period."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upcoming follow-ups" }));
    expect(
      screen.getByText("No follow-up reviews are due in the next workweek."),
    ).toBeInTheDocument();
  });

  it("keeps daily ticket details compact and renders multiline day notes", () => {
    const base = reportFixture();
    render(
      <ReportBuilder
        initialReport={{
          ...base,
          config: {
            ...base.config,
            includeDayNotes: true,
            includeTicketDetails: true,
            period: "daily",
          },
          dayNotes: [
            {
              body: "Confirmed Call Vision payloads.\nPrepared the PDF export.",
              isImportant: false,
              workDate: "2026-07-27",
            },
          ],
          end: "2026-07-27",
          start: "2026-07-27",
          ticketDetails: [
            {
              ticketNumber: "1909",
              title: "Update customer address",
              kind: "ticket",
              workItemId: "ticket-1",
              workDates: ["2026-07-27"],
            },
            {
              kind: "task",
              ticketNumber: null,
              title: "Prepare customer-safe report summary",
              workDates: ["2026-07-27"],
              workItemId: "task-1",
            },
          ],
        }}
      />,
    );

    expect(screen.queryByText("Worked Jul 27")).not.toBeInTheDocument();
    expect(
      screen.getByText("Confirmed Call Vision payloads."),
    ).toBeInTheDocument();
    expect(screen.getByText("Prepared the PDF export.")).toBeInTheDocument();
    expect(
      screen.getByText("Task").closest("li"),
    ).toHaveTextContent("Prepare customer-safe report summary");
  });
});
