import { describe, expect, it } from "vitest";

import { batchItems, mapWithConcurrency } from "@/features/calendar-sync/batch";

describe("calendar sync batching", () => {
  it("splits provider changes into bounded writes", () => {
    expect(batchItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(batchItems([], 100)).toEqual([]);
  });

  it("preserves result order while limiting concurrent calendars", async () => {
    let active = 0;
    let highestActive = 0;

    const results = await mapWithConcurrency([30, 5, 20, 10], 2, async (ms) => {
      active += 1;
      highestActive = Math.max(highestActive, active);
      await new Promise((resolve) => setTimeout(resolve, ms));
      active -= 1;
      return ms / 5;
    });

    expect(results).toEqual([6, 1, 4, 2]);
    expect(highestActive).toBe(2);
  });

  it("rejects invalid limits", async () => {
    expect(() => batchItems([1], 0)).toThrow("positive integer");
    await expect(
      mapWithConcurrency([1], 0, async (value) => value),
    ).rejects.toThrow("positive integer");
  });
});
