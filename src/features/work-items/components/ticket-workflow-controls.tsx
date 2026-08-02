"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateTicketWorkflowAction } from "@/features/work-items/actions";
import type {
  TicketOperationalStatus,
  TicketPriority,
  WorkTrackingState,
} from "@/features/work-items/types";

type WorkflowValues = {
  operationalStatus: TicketOperationalStatus;
  systemPriority: TicketPriority;
  trackingState: WorkTrackingState;
};

const selectClassName =
  "border-border bg-paper text-ink mt-2 w-full rounded-lg border px-3 py-2.5 text-sm font-bold outline-none focus:border-lavender-500 disabled:cursor-wait disabled:opacity-60";

export function TicketWorkflowControls({
  operationalStatus,
  systemPriority,
  trackingState,
  workItemId,
}: WorkflowValues & { workItemId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<WorkflowValues>({
    operationalStatus,
    systemPriority,
    trackingState,
  });
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "error" | "success";
  }>();

  function save(next: WorkflowValues) {
    if (
      next.trackingState !== values.trackingState &&
      next.trackingState === "closed" &&
      !window.confirm(
        "Close this ticket only if all downstream changes are confirmed complete. Continue?",
      )
    ) {
      return;
    }

    if (
      next.trackingState !== values.trackingState &&
      next.trackingState === "archived" &&
      !window.confirm(
        "Archive this ticket? It will leave active views, but you can restore it later.",
      )
    ) {
      return;
    }

    const previous = values;
    setValues(next);
    setFeedback(undefined);
    startTransition(async () => {
      const result = await updateTicketWorkflowAction({
        ...next,
        workItemId,
      });
      if (!result.ok) setValues(previous);
      setFeedback({
        message: result.message,
        tone: result.ok ? "success" : "error",
      });
      if (result.ok) router.refresh();
    });
  }

  return (
    <section className="border-lavender-200 bg-lavender-50 rounded-xl border p-5">
      <div className="flex items-start justify-between gap-5">
        <div>
          <h3 className="text-ink text-sm font-bold">Quick update</h3>
          <p className="text-muted mt-1 text-xs">
            Changes save automatically. Status and tracking remain in History.
          </p>
        </div>
        {feedback ? (
          <p
            role={feedback.tone === "error" ? "alert" : "status"}
            className={`text-xs font-bold ${
              feedback.tone === "error" ? "text-urgent-ink" : "text-success-ink"
            }`}
          >
            {feedback.message}
          </p>
        ) : pending ? (
          <p role="status" className="text-quiet text-xs font-bold">
            Saving…
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <label className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
          Work status
          <select
            aria-label="Quick work status"
            className={selectClassName}
            disabled={pending}
            value={values.operationalStatus}
            onChange={(event) =>
              save({
                ...values,
                operationalStatus: event.target
                  .value as TicketOperationalStatus,
              })
            }
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="waiting_response">Waiting for response</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>

        <label className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
          Tracking
          <select
            aria-label="Quick tracking"
            className={selectClassName}
            disabled={pending}
            value={values.trackingState}
            onChange={(event) =>
              save({
                ...values,
                trackingState: event.target.value as WorkTrackingState,
              })
            }
          >
            <option value="active">Active</option>
            <option value="watching">Watching</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
          Priority
          <select
            aria-label="Quick priority"
            className={selectClassName}
            disabled={pending}
            value={values.systemPriority}
            onChange={(event) =>
              save({
                ...values,
                systemPriority: event.target.value as TicketPriority,
              })
            }
          >
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>
    </section>
  );
}
