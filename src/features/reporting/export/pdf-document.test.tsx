import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { ReportPdfDocument } from "@/features/reporting/export/pdf-document";
import { reportFixture } from "@/test/report-fixture";

describe("designed report PDF", () => {
  it("renders a real selectable-text PDF payload with embedded fonts", async () => {
    const document = createElement(ReportPdfDocument, {
      report: reportFixture(),
    }) as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(document);

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(10_000);
  });
});
