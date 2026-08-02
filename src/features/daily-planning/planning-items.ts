import type { WorkInventoryRow } from "@/features/work-items/types";

export type PlanItemRow = {
  id: string;
  execution_status: string;
  position: number;
  work_item_id: string;
};

export type OtherPlanAssignment = {
  daily_plans: { status: string; work_date: string } | null;
  execution_status: string;
  work_item_id: string;
};

export type PlanningInventoryItem = WorkInventoryRow & {
  planItem: PlanItemRow | null;
  plannedElsewhere: boolean;
};

export function buildPlanningItems({
  inventory,
  otherPlanAssignments,
  planItems,
}: {
  inventory: WorkInventoryRow[];
  otherPlanAssignments: OtherPlanAssignment[];
  planItems: PlanItemRow[];
}): PlanningInventoryItem[] {
  const selectedByWorkId = new Map(
    planItems.map((item) => [item.work_item_id, item]),
  );
  const plannedElsewhereIds = new Set(
    otherPlanAssignments
      .filter(
        (assignment) =>
          assignment.daily_plans?.status !== "closed" &&
          assignment.daily_plans?.work_date,
      )
      .map((assignment) => assignment.work_item_id),
  );

  return inventory
    .filter(
      (item) =>
        item.id &&
        (selectedByWorkId.has(item.id) || !plannedElsewhereIds.has(item.id)) &&
        (selectedByWorkId.has(item.id) ||
          item.tracking_state === "active" ||
          item.tracking_state === "watching"),
    )
    .map((item) => ({
      ...item,
      planItem: selectedByWorkId.get(item.id!) ?? null,
      plannedElsewhere: plannedElsewhereIds.has(item.id!),
    }));
}
