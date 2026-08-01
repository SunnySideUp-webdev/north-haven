import { describe, expect, it } from "vitest";

import { isSameOriginReportRequest } from "@/server/security/report-export";

describe("report export security", () => {
  it("accepts same-origin requests and rejects cross-site origins", () => {
    expect(
      isSameOriginReportRequest(
        new Request("https://north-haven.test/api/reports/export", {
          headers: { origin: "https://north-haven.test" },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOriginReportRequest(
        new Request("https://north-haven.test/api/reports/export", {
          headers: { origin: "https://example.test" },
        }),
      ),
    ).toBe(false);
  });
});
