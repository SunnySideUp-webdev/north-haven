"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { bulkImportTicketsAction } from "@/features/work-items/actions";
import {
  parseTicketSystemPaste,
  sourceStatusToOperationalStatus,
  type TicketImportDraft,
} from "@/features/work-items/bulk-ticket-import";
import type { TicketTypeOption } from "@/features/work-items/types";
import { formatTicketNumber } from "@/shared/ticket-number";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function BulkTicketImportDialog({
  existingTicketNumbers,
  ticketTypes,
}: {
  existingTicketNumbers: string[];
  ticketTypes: TicketTypeOption[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    text: string;
    tone: "error" | "success";
  }>();

  const existingNumbers = useMemo(
    () => new Set(existingTicketNumbers.map((value) => normalize(value))),
    [existingTicketNumbers],
  );
  const defaultTicketType =
    ticketTypes.find((type) => normalize(type.name) === "form information") ??
    ticketTypes[0];

  const drafts = useMemo<TicketImportDraft[]>(() => {
    const byName = new Map(
      ticketTypes.map((type) => [normalize(type.name), type.id]),
    );

    return parseTicketSystemPaste(text).map((ticket) => ({
      ...ticket,
      duplicate: existingNumbers.has(normalize(ticket.ticketNumber)),
      ticketTypeId:
        byName.get(normalize(ticket.ticketTypeName)) ??
        defaultTicketType?.id ??
        "",
    }));
  }, [defaultTicketType?.id, existingNumbers, text, ticketTypes]);

  const importable = drafts.filter(
    (ticket) => !ticket.duplicate && ticket.ticketTypeId,
  );
  const duplicates = drafts.length - importable.length;

  function openDialog() {
    setMessage(undefined);
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function importTickets() {
    setMessage(undefined);
    startTransition(async () => {
      const result = await bulkImportTicketsAction({
        tickets: importable.map((ticket) => ({
          category: ticket.category,
          createdLabel: ticket.createdLabel,
          operationalStatus: sourceStatusToOperationalStatus(
            ticket.sourceStatus,
          ),
          receivedAt: ticket.receivedAt,
          requesterEmail: ticket.requesterEmail,
          requesterName: ticket.requesterName,
          sourceStatus: ticket.sourceStatus,
          systemPriority: ticket.systemPriority,
          ticketNumber: ticket.ticketNumber,
          ticketTypeId: ticket.ticketTypeId,
          title: ticket.title,
        })),
      });

      setMessage({
        text: result.message,
        tone: result.ok ? "success" : "error",
      });
      if (result.ok) {
        setText("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="border-lavender-300 bg-lavender-50 text-lavender-700 hover:bg-lavender-100 rounded-lg border px-4 py-3 text-sm font-bold"
      >
        Import tickets
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="bulk-ticket-import-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        className="backdrop:bg-ink/25 bg-paper border-border shadow-surface m-auto w-full max-w-[980px] rounded-2xl border p-0 backdrop:backdrop-blur-[2px]"
      >
        <div className="border-blush-200 bg-lavender-100 flex items-start justify-between gap-6 border-b-2 px-7 py-6">
          <div>
            <p className="text-quiet text-xs font-bold tracking-[0.12em] uppercase">
              Bulk import
            </p>
            <h2
              id="bulk-ticket-import-title"
              className="text-ink mt-2 text-2xl font-bold tracking-[-0.03em]"
            >
              Paste tickets from the ticket system
            </h2>
            <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
              Copy the visible ticket list, paste it here, review the preview,
              then import everything into Work Inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="text-muted hover:text-ink rounded-md px-2 py-1 text-sm font-bold"
          >
            Close
          </button>
        </div>

        <div className="grid max-h-[72vh] grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] overflow-hidden">
          <div className="border-border border-r p-6">
            <label
              htmlFor="ticket-import-paste"
              className="text-quiet text-xs font-bold tracking-[0.12em] uppercase"
            >
              Copied text
            </label>
            <textarea
              id="ticket-import-paste"
              value={text}
              onChange={(event) => {
                setMessage(undefined);
                setText(event.target.value);
              }}
              placeholder="Paste the copied ticket list here..."
              className="border-border bg-canvas text-ink placeholder:text-quiet focus:border-lavender-500 mt-3 h-[420px] w-full resize-none rounded-xl border p-4 text-sm leading-6 outline-none"
            />
            <p className="text-muted mt-3 text-xs leading-5">
              Dates like “Created 7 days ago” are converted into approximate
              received dates so old-to-new ordering still works.
            </p>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="border-border flex items-center justify-between gap-4 border-b px-6 py-4">
              <div>
                <p className="text-ink text-sm font-bold">
                  {drafts.length
                    ? `${plural(importable.length, "ticket")} ready`
                    : "No tickets detected yet"}
                </p>
                {duplicates ? (
                  <p className="text-waiting-ink mt-1 text-xs font-bold">
                    {plural(duplicates, "duplicate")} will be skipped.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={!importable.length || pending}
                onClick={importTickets}
                className="bg-lavender-700 hover:bg-lavender-500 rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Importing…" : "Import tickets"}
              </button>
            </div>

            {message ? (
              <p
                role={message.tone === "error" ? "alert" : "status"}
                className={`mx-6 mt-4 rounded-lg px-4 py-3 text-sm ${
                  message.tone === "success"
                    ? "bg-success-surface text-success-ink"
                    : "bg-urgent-surface text-urgent-ink"
                }`}
              >
                {message.text}
              </p>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {!ticketTypes.length ? (
                <div className="bg-urgent-surface text-urgent-ink rounded-xl px-4 py-3 text-sm font-bold">
                  Add at least one ticket type before importing tickets.
                </div>
              ) : drafts.length ? (
                <div className="space-y-3">
                  {drafts.slice(0, 100).map((ticket) => (
                    <article
                      key={ticket.ticketNumber}
                      className={`border-border rounded-xl border p-4 ${
                        ticket.duplicate ? "bg-canvas opacity-70" : "bg-paper"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-ink text-sm font-bold">
                            {formatTicketNumber(ticket.ticketNumber)} ·{" "}
                            {ticket.title}
                          </p>
                          <p className="text-muted mt-1 text-xs">
                            {ticket.ticketTypeName} · {ticket.systemPriority} ·{" "}
                            {ticket.receivedAt}
                          </p>
                        </div>
                        {ticket.duplicate ? (
                          <span className="bg-blush-100 text-urgent-ink rounded-full px-3 py-1 text-xs font-bold">
                            Duplicate
                          </span>
                        ) : (
                          <span className="bg-success-surface text-success-ink rounded-full px-3 py-1 text-xs font-bold">
                            Ready
                          </span>
                        )}
                      </div>
                      {ticket.requesterName || ticket.requesterEmail ? (
                        <p className="text-quiet mt-3 text-xs">
                          {ticket.requesterName}
                          {ticket.requesterEmail
                            ? ` · ${ticket.requesterEmail}`
                            : ""}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="border-border bg-canvas text-muted rounded-xl border border-dashed px-6 py-12 text-center text-sm">
                  Paste copied tickets to see a calm little preview here.
                </div>
              )}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
