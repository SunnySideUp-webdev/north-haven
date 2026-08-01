"use client";

import { useActionState } from "react";

import {
  createTicketTypeAction,
  manageTicketTypeAction,
} from "@/features/work-items/actions";
import {
  WorkFormMessage,
  WorkSubmitButton,
  workFieldClassName,
} from "@/features/work-items/components/work-form-controls";
import {
  initialWorkFormState,
  type ManagedTicketType,
} from "@/features/work-items/types";

function TicketTypeRow({
  canMoveDown,
  canMoveUp,
  ticketType,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  ticketType: ManagedTicketType;
}) {
  const [state, action] = useActionState(
    manageTicketTypeAction,
    initialWorkFormState,
  );

  return (
    <form
      action={action}
      className="border-border border-t py-5 first:border-t-0"
    >
      <input type="hidden" name="ticketTypeId" value={ticketType.id} />
      <WorkFormMessage message={state.message} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-4">
        <label className="text-ink block text-sm font-bold">
          Name
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={ticketType.name}
            className={workFieldClassName}
          />
        </label>
        <label className="border-border text-muted flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={ticketType.is_active}
            className="accent-lavender-700 h-4 w-4"
          />
          Active
        </label>
        <button
          type="submit"
          className="bg-lavender-700 hover:bg-lavender-500 min-h-11 rounded-lg px-5 text-sm font-bold text-white"
        >
          Save
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-quiet mr-1 text-xs">Display order</span>
        <button
          type="submit"
          name="direction"
          value="-1"
          disabled={!canMoveUp}
          className="border-border text-muted hover:text-ink rounded-md border px-3 py-1.5 text-xs font-bold disabled:opacity-35"
        >
          Move up
        </button>
        <button
          type="submit"
          name="direction"
          value="1"
          disabled={!canMoveDown}
          className="border-border text-muted hover:text-ink rounded-md border px-3 py-1.5 text-xs font-bold disabled:opacity-35"
        >
          Move down
        </button>
      </div>
    </form>
  );
}

export function TicketTypeSettings({
  ticketTypes,
}: {
  ticketTypes: ManagedTicketType[];
}) {
  const [state, action] = useActionState(
    createTicketTypeAction,
    initialWorkFormState,
  );

  return (
    <section
      id="ticket-types"
      className="border-border/70 bg-paper shadow-surface rounded-xl border p-8"
    >
      <h2 className="text-ink text-xl font-bold">Ticket types</h2>
      <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
        Keep the choices short and useful. Inactive types stay attached to
        existing tickets but disappear from new ticket forms.
      </p>

      <form
        action={action}
        className="bg-lavender-50 border-lavender-200 mt-7 rounded-lg border p-5"
      >
        <WorkFormMessage message={state.message} />
        <div className="flex items-end gap-4">
          <label className="text-ink min-w-0 flex-1 text-sm font-bold">
            New ticket type
            <input
              name="name"
              required
              maxLength={80}
              className={workFieldClassName}
              placeholder="e.g. Redirect"
            />
          </label>
          <WorkSubmitButton label="Add type" />
        </div>
      </form>

      <div className="mt-7">
        {ticketTypes.map((ticketType, index) => (
          <TicketTypeRow
            key={ticketType.id}
            ticketType={ticketType}
            canMoveUp={index > 0}
            canMoveDown={index < ticketTypes.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
