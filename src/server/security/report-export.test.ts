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

  it("uses the public host when Next.js normalizes a local URL internally", () => {
    expect(
      isSameOriginReportRequest(
        new Request("http://localhost:3000/api/reports/export", {
          headers: {
            host: "127.0.0.1:3000",
            origin: "http://127.0.0.1:3000",
            "sec-fetch-site": "same-origin",
          },
        }),
      ),
    ).toBe(true);
  });

  it("still rejects browser requests identified as cross-site", () => {
    expect(
      isSameOriginReportRequest(
        new Request("http://localhost:3000/api/reports/export", {
          headers: {
            host: "example.test",
            origin: "https://example.test",
            "sec-fetch-site": "cross-site",
          },
        }),
      ),
    ).toBe(false);
  });
});
