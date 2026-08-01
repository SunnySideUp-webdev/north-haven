"use client";

import { useActionState } from "react";

import {
  addWorkItemNoteAction,
  saveFollowUpAction,
} from "@/features/work-items/actions";
import {
  WorkFormMessage,
  WorkSubmitButton,
  workFieldClassName,
} from "@/features/work-items/components/work-form-controls";
import { initialWorkFormState } from "@/features/work-items/types";

export function AddNoteForm({ workItemId }: { workItemId: string }) {
  const [state, action] = useActionState(
    addWorkItemNoteAction,
    initialWorkFormState,
  );

  return (
    <form
      action={action}
      className="border-border bg-lavender-50 rounded-lg border p-4"
    >
      <input type="hidden" name="workItemId" value={workItemId} />
      <WorkFormMessage message={state.message} />
      <label className="text-ink block text-sm font-bold">
        Add an activity note
        <textarea
          name="body"
          required
          maxLength={10_000}
          rows={3}
          className={`${workFieldClassName} resize-y`}
        />
      </label>
      <div className="mt-3 flex justify-end">
        <WorkSubmitButton label="Add note" />
      </div>
    </form>
  );
}

export function FollowUpForm({
  current,
  workItemId,
}: {
  current?: {
    reason: string;
    review_on: string | null;
    waiting_on: string | null;
  };
  workItemId: string;
}) {
  const [state, action] = useActionState(
    saveFollowUpAction,
    initialWorkFormState,
  );

  return (
    <form
      action={action}
      className="border-border bg-blush-50 rounded-lg border p-4"
    >
      <input type="hidden" name="workItemId" value={workItemId} />
      <WorkFormMessage message={state.message} />
      <p className="text-ink text-sm font-bold">Open follow-up</p>
      <div className="mt-3 space-y-3">
        <label className="text-muted block text-xs font-bold">
          Reason
          <input
            name="reason"
            required
            maxLength={500}
            defaultValue={current?.reason ?? ""}
            className={workFieldClassName}
          />
        </label>
        <label className="text-muted block text-xs font-bold">
          Waiting on
          <input
            name="waitingOn"
            maxLength={200}
            defaultValue={current?.waiting_on ?? ""}
            className={workFieldClassName}
          />
        </label>
        <label className="text-muted block text-xs font-bold">
          Review on
          <input
            type="date"
            name="reviewOn"
            defaultValue={current?.review_on ?? ""}
            className={workFieldClassName}
          />
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <WorkSubmitButton label="Save follow-up" />
      </div>
    </form>
  );
}
