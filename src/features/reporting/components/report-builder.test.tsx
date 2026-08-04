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
    fireEvent.click(screen.getByLabelText(/Ticket numbers and titles/));
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

    fireEvent.click(screen.getByLabelText(/Ticket numbers and titles/));
    fireEvent.click(screen.getByLabelText(/Day notes/));
    fireEvent.click(screen.getByLabelText(/Follow-up reasons/));

    expect(screen.getByRole("heading", { name: "Tickets worked" }));
    expect(
      screen.getByText(
        "No ticket numbers or titles matched this report period.",
      ),
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
});
