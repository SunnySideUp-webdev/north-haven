"use client";

import { useActionState } from "react";

import {
  addWorkItemNoteAction,
  saveFollowUpAction,
  transitionFollowUpAction,
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
    id: string;
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
    <div className="border-border bg-blush-50 rounded-lg border p-4">
      <form action={action}>
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
      {current ? (
        <FollowUpDecision followUpId={current.id} workItemId={workItemId} />
      ) : null}
    </div>
  );
}

function FollowUpDecision({
  followUpId,
  workItemId,
}: {
  followUpId: string;
  workItemId: string;
}) {
  const [state, action] = useActionState(
    transitionFollowUpAction,
    initialWorkFormState,
  );

  return (
    <form action={action} className="border-blush-200 mt-4 border-t pt-4">
      <input type="hidden" name="followUpId" value={followUpId} />
      <input type="hidden" name="workItemId" value={workItemId} />
      <WorkFormMessage message={state.message} />
      <p className="text-muted text-xs leading-5">
        Finish this follow-up when a response arrives, or cancel it when it is
        no longer relevant.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          name="state"
          value="completed"
          className="bg-success-surface text-success-ink rounded-lg px-3 py-2 text-xs font-bold"
        >
          Mark completed
        </button>
        <button
          type="submit"
          name="state"
          value="cancelled"
          className="border-border bg-paper text-muted hover:text-ink rounded-lg border px-3 py-2 text-xs font-bold"
        >
          No longer relevant
        </button>
      </div>
    </form>
  );
}
