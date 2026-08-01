"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import {
  createReminderAction,
  createTaskAction,
  createTicketAction,
  updateReminderAction,
  updateTaskAction,
  updateTicketAction,
} from "@/features/work-items/actions";
import {
  initialWorkFormState,
  type TicketTypeOption,
  type WorkInventoryRow,
  type WorkItemKind,
} from "@/features/work-items/types";
import {
  WorkFormMessage,
  WorkSubmitButton,
  workFieldClassName,
} from "@/features/work-items/components/work-form-controls";

type WorkAction = (
  state: typeof initialWorkFormState,
  data: FormData,
) => Promise<typeof initialWorkFormState>;

const actions = {
  create: {
    reminder: createReminderAction,
    task: createTaskAction,
    ticket: createTicketAction,
  },
  edit: {
    reminder: updateReminderAction,
    task: updateTaskAction,
    ticket: updateTicketAction,
  },
} satisfies Record<"create" | "edit", Record<WorkItemKind, WorkAction>>;

function localInputValue(isoValue: string | null | undefined) {
  if (!isoValue) return "";

  const date = new Date(isoValue);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function WorkItemForm({
  defaultReceivedAt,
  item,
  kind,
  ticketTypes = [],
}: Readonly<{
  defaultReceivedAt: string;
  item?: WorkInventoryRow;
  kind: WorkItemKind;
  ticketTypes?: TicketTypeOption[];
}>) {
  const mode = item ? "edit" : "create";
  const [state, action] = useActionState(
    actions[mode][kind],
    initialWorkFormState,
  );
  const localDateTimeRef = useRef<HTMLInputElement>(null);
  const isoDateTimeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localDateTimeRef.current) {
      const value = kind === "reminder" ? item?.remind_at : item?.due_at;
      localDateTimeRef.current.value = localInputValue(value);
    }
  }, [item?.due_at, item?.remind_at, kind]);

  function prepareDateTime() {
    if (!isoDateTimeRef.current || !localDateTimeRef.current) return;

    isoDateTimeRef.current.value = localDateTimeRef.current.value
      ? new Date(localDateTimeRef.current.value).toISOString()
      : "";
  }

  const noun = kind[0].toUpperCase() + kind.slice(1);

  return (
    <form
      action={action}
      onSubmit={prepareDateTime}
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          prepareDateTime();
          event.currentTarget.requestSubmit();
        }
      }}
      className="border-border/70 bg-paper shadow-surface rounded-xl border p-8"
    >
      <WorkFormMessage message={state.message} />
      {item?.id ? (
        <input type="hidden" name="workItemId" value={item.id} />
      ) : null}

      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        {kind === "ticket" ? (
          <>
            <label className="text-ink block text-sm font-bold">
              Ticket number
              <input
                name="ticketNumber"
                autoFocus
                required
                maxLength={80}
                defaultValue={item?.ticket_number ?? ""}
                className={workFieldClassName}
                placeholder="e.g. 123456"
              />
            </label>
            <label className="text-ink block text-sm font-bold">
              Ticket type
              <select
                name="ticketTypeId"
                required
                defaultValue={item?.ticket_type_id ?? ticketTypes[0]?.id ?? ""}
                className={workFieldClassName}
              >
                {ticketTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        <label className="text-ink col-span-2 block text-sm font-bold">
          {noun} title
          <input
            name="title"
            autoFocus={kind !== "ticket"}
            required
            maxLength={200}
            defaultValue={item?.title ?? ""}
            className={workFieldClassName}
            placeholder={
              kind === "ticket"
                ? "A concise description of the request"
                : `What needs your attention?`
            }
          />
        </label>

        {kind === "ticket" ? (
          <>
            <label className="text-ink block text-sm font-bold">
              Received date
              <input
                type="date"
                name="receivedAt"
                required
                defaultValue={item?.received_at ?? defaultReceivedAt}
                className={workFieldClassName}
              />
            </label>
            <label className="text-ink block text-sm font-bold">
              System priority
              <select
                name="systemPriority"
                defaultValue={item?.system_priority ?? "medium"}
                className={workFieldClassName}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="text-ink block text-sm font-bold">
              Work status
              <select
                name="operationalStatus"
                defaultValue={item?.operational_status ?? "pending"}
                className={workFieldClassName}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_response">Waiting for response</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label className="text-ink block text-sm font-bold">
              Secure ticket link
              <input
                type="url"
                name="externalUrl"
                inputMode="url"
                defaultValue={item?.external_url ?? ""}
                className={workFieldClassName}
                placeholder="https://…"
              />
            </label>
          </>
        ) : null}

        {kind === "task" || kind === "reminder" ? (
          <label className="text-ink col-span-2 block max-w-md text-sm font-bold">
            {kind === "reminder" ? "Remind me" : "Due date (optional)"}
            <input
              ref={localDateTimeRef}
              type="datetime-local"
              required={kind === "reminder"}
              className={workFieldClassName}
            />
            <input
              ref={isoDateTimeRef}
              type="hidden"
              name={kind === "reminder" ? "remindAtIso" : "dueAtIso"}
            />
          </label>
        ) : null}

        {mode === "edit" ? (
          <label className="text-ink block text-sm font-bold">
            Tracking
            <select
              name="trackingState"
              defaultValue={item?.tracking_state ?? "active"}
              className={workFieldClassName}
            >
              <option value="active">Active</option>
              <option value="watching">Watching</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        ) : null}

        <label className="text-ink col-span-2 block text-sm font-bold">
          Notes
          <textarea
            name="description"
            rows={5}
            maxLength={10_000}
            defaultValue={item?.description ?? ""}
            className={`${workFieldClassName} resize-y leading-6`}
            placeholder="Keep the context you will need later."
          />
        </label>

        {kind === "ticket" ? (
          <label className="border-border bg-lavender-50 text-ink col-span-2 flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-4 text-sm font-bold">
            <input
              type="checkbox"
              name="formBackupComplete"
              defaultChecked={Boolean(item?.form_backup_completed_at)}
              className="accent-lavender-700 h-4 w-4"
            />
            Form backup completed
          </label>
        ) : null}

        {kind === "ticket" && mode === "create" ? (
          <label className="text-ink col-span-2 block text-sm font-bold">
            First activity note (optional)
            <textarea
              name="note"
              rows={3}
              maxLength={10_000}
              className={`${workFieldClassName} resize-y leading-6`}
            />
          </label>
        ) : null}
      </div>

      <div className="border-border mt-8 flex items-center justify-end gap-4 border-t pt-6">
        <span className="text-quiet mr-auto text-xs">
          Save with Ctrl/⌘ Enter
        </span>
        <Link
          href={item?.id ? `/work/${item.id}` : "/work"}
          className="text-muted hover:text-ink px-3 py-2 text-sm font-bold"
        >
          Cancel
        </Link>
        <WorkSubmitButton
          label={mode === "edit" ? `Save ${kind}` : `Create ${kind}`}
        />
      </div>
    </form>
  );
}
