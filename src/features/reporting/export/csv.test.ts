import { describe, expect, it } from "vitest";

import { reportToCsv } from "@/features/reporting/export/csv";
import { reportFixture } from "@/test/report-fixture";

describe("report CSV", () => {
  it("exports date rows and a total row without details by default", () => {
    const csv = reportToCsv(reportFixture());
    expect(csv).toContain("record_type,date,tickets_worked");
    expect(csv).toContain(
      "pending_tickets,in_progress_tickets,waiting_for_response,resolved_status_tickets",
    );
    expect(csv).not.toContain("active_tickets");
    expect(csv).not.toContain("watching_tickets");
    expect(csv).toContain("date,2026-07-27,2,1,1");
    expect(csv).toContain("period_total,2026-07-27/2026-07-31,5,3,1");
    expect(csv).not.toContain("Customer address");
  });

  it("quotes explicitly selected ticket titles and notes", () => {
    const base = reportFixture();
    const csv = reportToCsv({
      ...base,
      config: {
        ...base.config,
        includeDayNotes: true,
        includeTicketDetails: true,
      },
      dayNotes: [
        {
          body: "Customer address, confirmed",
          isImportant: true,
          workDate: "2026-07-27",
        },
      ],
      ticketDetails: [
        {
          ticketNumber: "DEMO-1",
          title: 'Update "main" form',
          workDates: ["2026-07-27"],
        },
      ],
    });
    expect(csv).toContain("DEMO-1");
    expect(csv).toContain('"Update ""main"" form"');
    expect(csv).toContain('"Customer address, confirmed"');
  });
});
