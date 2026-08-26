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

const BLOCKING_OPEN_PLAN_STATUSES = new Set(["planned", "in_progress"]);

export function isCompletedPlanningCandidate(item: WorkInventoryRow): boolean {
  if (item.kind === "ticket") {
    return item.operational_status === "resolved" || Boolean(item.resolved_at);
  }

  if (item.kind === "task") return Boolean(item.task_completed_at);

  if (item.kind === "reminder") return Boolean(item.reminder_acknowledged_at);

  return false;
}

export function isBlockingPlanAssignment(
  assignment: OtherPlanAssignment,
): boolean {
  if (!assignment.daily_plans?.work_date) return false;

  if (assignment.execution_status === "done") return true;

  return (
    assignment.daily_plans.status !== "closed" &&
    BLOCKING_OPEN_PLAN_STATUSES.has(assignment.execution_status)
  );
}

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
      .filter((assignment) => isBlockingPlanAssignment(assignment))
      .map((assignment) => assignment.work_item_id),
  );

  return inventory
    .filter(
      (item) =>
        item.id &&
        (selectedByWorkId.has(item.id) || !plannedElsewhereIds.has(item.id)) &&
        (selectedByWorkId.has(item.id) ||
          !isCompletedPlanningCandidate(item)) &&
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
