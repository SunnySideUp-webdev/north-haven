import { describe, expect, it } from "vitest";

import {
  buildPlanningItems,
  type OtherPlanAssignment,
  type PlanItemRow,
} from "@/features/daily-planning/planning-items";
import type { WorkInventoryRow } from "@/features/work-items/types";

function item(
  id: string,
  title = id,
  overrides: Partial<WorkInventoryRow> = {},
): WorkInventoryRow {
  return {
    id,
    title,
    kind: "ticket",
    operational_status: "pending",
    tracking_state: "active",
    ...overrides,
  } as WorkInventoryRow;
}

function planItem(workItemId: string): PlanItemRow {
  return {
    execution_status: "planned",
    id: `plan-${workItemId}`,
    position: 0,
    work_item_id: workItemId,
  };
}

function assignment(workItemId: string, status = "ready"): OtherPlanAssignment {
  return {
    daily_plans: { status, work_date: "2026-08-03" },
    execution_status: "planned",
    work_item_id: workItemId,
  };
}

describe("buildPlanningItems", () => {
  it("hides active work that is already selected in another open plan", () => {
    const result = buildPlanningItems({
      inventory: [item("available"), item("planned-elsewhere")],
      otherPlanAssignments: [assignment("planned-elsewhere")],
      planItems: [],
    });

    expect(result.map((row) => row.id)).toEqual(["available"]);
  });

  it("keeps work selected in the current plan visible even if another plan references it", () => {
    const result = buildPlanningItems({
      inventory: [item("current")],
      otherPlanAssignments: [assignment("current")],
      planItems: [planItem("current")],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.planItem?.work_item_id).toBe("current");
  });

  it("does not block work from a closed plan", () => {
    const result = buildPlanningItems({
      inventory: [item("closed-plan")],
      otherPlanAssignments: [assignment("closed-plan", "closed")],
      planItems: [],
    });

    expect(result.map((row) => row.id)).toEqual(["closed-plan"]);
  });

  it("hides resolved tickets from new planning options", () => {
    const result = buildPlanningItems({
      inventory: [
        item("pending-ticket"),
        item("resolved-ticket", "resolved-ticket", {
          operational_status: "resolved",
        }),
        item("normal-task", "normal-task", {
          kind: "task",
          operational_status: null,
        }),
      ],
      otherPlanAssignments: [],
      planItems: [],
    });

    expect(result.map((row) => row.id)).toEqual([
      "pending-ticket",
      "normal-task",
    ]);
  });

  it("keeps resolved tickets visible when they are already in the current plan", () => {
    const result = buildPlanningItems({
      inventory: [
        item("resolved-current", "resolved-current", {
          operational_status: "resolved",
        }),
      ],
      otherPlanAssignments: [],
      planItems: [planItem("resolved-current")],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.planItem?.work_item_id).toBe("resolved-current");
  });
});
