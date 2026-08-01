import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TodayView } from "@/features/daily-planning/components/today-view";
import { foundationPlan } from "@/features/daily-planning/data/foundation-plan";

describe("TodayView", () => {
  it("keeps normal tasks distinct from ticket work", () => {
    render(<TodayView plan={foundationPlan} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Today" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Prepare weekly status report"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("#1909 · Update customer address"),
    ).toBeInTheDocument();
  });
});
