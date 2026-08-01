"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  applyEndOfDayOutcomeAction,
  finishEndOfDayAction,
  resolveEndOfDayFollowUpAction,
  saveDayNoteAction,
  setEndOfDayStepAction,
  type PlanningActionResult,
} from "@/features/daily-planning/actions";
import type { WorkInventoryRow } from "@/features/work-items/types";
import { PageHeader } from "@/shared/ui/page-header";

type EodItem = WorkInventoryRow & {
  planItem: { id: string; position: number; execution_status: string } | null;
};
type Runner = (
  action: () => Promise<PlanningActionResult>,
  after?: () => void,
) => void;
type EodFollowUp = {
  id: string;
  reason: string;
  review_on: string | null;
  title: string;
  waiting_on: string | null;
};
type EodOutcome = "done" | "returned" | "watching" | "skipped";
type FollowUpDecision =
  "response_received" | "external_completed" | "no_longer_relevant";
const steps = [
  "Update Tickets",
  "Close Today",
  "Review Follow-ups",
  "Plan Next Workday",
];

export function EndOfDayFlow({
  data,
  initialStep,
  workDate,
}: {
  data: {
    dayNote: { body: string; is_important: boolean } | null;
    followUps: {
      id: string;
      reason: string;
      review_on: string | null;
      title: string;
      waiting_on: string | null;
    }[];
    items: EodItem[];
    nextPlan: { status: string } | null;
    nextWorkDate: string | null;
    plan: { status: string; end_of_day_step: number } | null;
  };
  initialStep: number;
  workDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(
    Math.max(initialStep, data.plan?.end_of_day_step || 1),
  );
  const [message, setMessage] = useState<string>();
  const [note, setNote] = useState(data.dayNote?.body ?? "");
  const [important, setImportant] = useState(
    data.dayNote?.is_important ?? false,
  );
  const planned = data.items
    .filter((item) => item.planItem)
    .sort((a, b) => a.planItem!.position - b.planItem!.position);
  const unresolved = planned.filter((item) =>
    ["planned", "in_progress"].includes(item.planItem!.execution_status),
  ).length;

  function run(
    action: () => Promise<{ ok: boolean; message?: string }>,
    after?: () => void,
  ) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setMessage(result.message);
      else after?.();
      router.refresh();
    });
  }
  function go(next: number) {
    run(
      () => setEndOfDayStepAction({ step: next, workDate }),
      () => setStep(next),
    );
  }

  if (data.plan?.status === "closed")
    return (
      <>
        <PageHeader
          title="Your next workday is ready."
          description={data.nextWorkDate ?? "End of Day complete"}
          align="center"
        />
        <div className="mx-auto max-w-[760px] p-8">
          <section className="border-border bg-paper shadow-surface rounded-xl border p-12 text-center">
            <p className="text-muted">
              Today is closed and your next plan is ready when you return.
            </p>
            <Link
              href="/today"
              className="bg-lavender-700 mt-7 inline-block rounded-lg px-6 py-3 text-sm font-bold text-white"
            >
              Return to Today
            </Link>
          </section>
        </div>
      </>
    );

  return (
    <>
      <PageHeader
        title="End of Day"
        description="Close the day deliberately. Nothing moves without your decision."
        action={
          <Link
            href="/today"
            className="border-border bg-paper text-muted rounded-lg border px-5 py-3 text-sm font-bold"
          >
            Save and exit
          </Link>
        }
      />
      <div className="mx-auto max-w-[1120px] p-8">
        <nav
          aria-label="End of Day progress"
          className="border-border bg-paper grid grid-cols-4 rounded-xl border p-2"
        >
          {steps.map((label, index) => (
            <button
              key={label}
              onClick={() =>
                index + 1 <= Math.max(step, data.plan?.end_of_day_step || 1) &&
                setStep(index + 1)
              }
              className={`rounded-lg px-3 py-3 text-sm font-bold ${step === index + 1 ? "bg-lavender-100 text-lavender-700" : "text-muted"}`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </nav>
        {message ? (
          <p
            role="alert"
            className="bg-urgent-surface text-urgent-ink mt-6 rounded-lg px-4 py-3 text-sm"
          >
            {message}
          </p>
        ) : null}
        <section className="border-border/70 bg-paper shadow-surface mt-7 rounded-xl border p-8">
          {step === 1 ? (
            <div>
              <h2 className="text-ink text-2xl font-bold">Update tickets</h2>
              <p className="text-muted mt-2 text-sm">
                Add anything received today and update the tickets you touched.
              </p>
              <div className="mt-7 flex gap-3">
                <Link
                  href="/work/new/ticket"
                  className="bg-lavender-700 rounded-lg px-5 py-3 text-sm font-bold text-white"
                >
                  Add ticket
                </Link>
                <Link
                  href="/work"
                  className="border-border text-muted rounded-lg border px-5 py-3 text-sm font-bold"
                >
                  Open inventory
                </Link>
              </div>
              <div className="mt-8 space-y-3">
                {planned
                  .filter((i) => i.kind === "ticket")
                  .map((item) => (
                    <Link
                      key={item.id}
                      href={`/work/${item.id}/edit`}
                      className="border-border flex rounded-lg border px-5 py-4 text-sm font-bold"
                    >
                      {item.ticket_number} · {item.title}
                      <span className="text-lavender-700 ml-auto">Review</span>
                    </Link>
                  ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => go(2)}
                  className="bg-lavender-700 rounded-lg px-6 py-3 text-sm font-bold text-white"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}
          {step === 2 ? (
            <CloseToday
              items={planned}
              nextDate={data.nextWorkDate}
              pending={pending}
              run={run}
              note={note}
              setNote={setNote}
              important={important}
              setImportant={setImportant}
              workDate={workDate}
              unresolved={unresolved}
              onContinue={() => go(3)}
            />
          ) : null}
          {step === 3 ? (
            <FollowUpReview
              followUps={data.followUps}
              pending={pending}
              run={run}
              onContinue={() => go(4)}
            />
          ) : null}
          {step === 4 ? (
            <div>
              <h2 className="text-ink text-2xl font-bold">Plan next workday</h2>
              <p className="text-muted mt-2 text-sm">
                Your next available workday is{" "}
                <strong>{data.nextWorkDate}</strong>.
              </p>
              <div className="bg-lavender-50 mt-7 rounded-xl p-6">
                <p className="text-sm font-bold">
                  Next plan:{" "}
                  <span className="capitalize">
                    {data.nextPlan?.status ?? "Not started"}
                  </span>
                </p>
                <Link
                  href={`/plan?date=${data.nextWorkDate}`}
                  className="text-lavender-700 mt-3 inline-block text-sm font-bold"
                >
                  Review next workday plan →
                </Link>
              </div>
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="text-muted text-sm font-bold"
                >
                  Back
                </button>
                <button
                  disabled={
                    pending ||
                    data.nextPlan?.status !== "ready" ||
                    unresolved > 0 ||
                    data.followUps.length > 0
                  }
                  onClick={() => run(() => finishEndOfDayAction({ workDate }))}
                  className="bg-lavender-700 rounded-lg px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  Finish End of Day
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}

function CloseToday({
  items,
  nextDate,
  pending,
  run,
  note,
  setNote,
  important,
  setImportant,
  workDate,
  unresolved,
  onContinue,
}: {
  items: EodItem[];
  nextDate: string | null;
  pending: boolean;
  run: Runner;
  note: string;
  setNote: (value: string) => void;
  important: boolean;
  setImportant: (value: boolean) => void;
  workDate: string;
  unresolved: number;
  onContinue: () => void;
}) {
  return (
    <div>
      <h2 className="text-ink text-2xl font-bold">Close today</h2>
      <p className="text-muted mt-2 text-sm">
        Every planned item needs an explicit outcome.
      </p>
      <div className="mt-7 space-y-4">
        {items.map((item: EodItem) => (
          <OutcomeRow key={item.id} item={item} nextDate={nextDate} run={run} />
        ))}
      </div>
      <div className="border-border mt-8 border-t pt-7">
        <label className="text-ink text-sm font-bold">
          Day note
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="border-border mt-2 w-full rounded-lg border px-4 py-3"
          />
        </label>
        <label className="text-muted mt-3 flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={important}
            onChange={(e) => setImportant(e.target.checked)}
          />
          Important note
        </label>
        <button
          onClick={() =>
            run(() => saveDayNoteAction({ body: note, important, workDate }))
          }
          className="border-border mt-4 rounded-lg border px-4 py-2 text-sm font-bold"
        >
          Save note
        </button>
      </div>
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => onContinue()}
          disabled={pending || unresolved > 0}
          className="bg-lavender-700 ml-auto rounded-lg px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
function OutcomeRow({
  item,
  nextDate,
  run,
}: {
  item: EodItem;
  nextDate: string | null;
  run: Runner;
}) {
  const [deferDate, setDeferDate] = useState(nextDate ?? "");
  const current = item.planItem!.execution_status;
  return (
    <article className="border-border rounded-lg border p-5">
      <div className="flex items-center">
        <div>
          <p className="text-ink text-sm font-bold">
            {item.ticket_number ? `${item.ticket_number} · ` : ""}
            {item.title}
          </p>
          <p className="text-quiet mt-1 text-xs capitalize">
            Current outcome: {current.replaceAll("_", " ")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["done", "Done"],
            ["returned", "Return to inventory"],
            ["watching", "Keep watching"],
            ["skipped", "No longer needed"],
          ] satisfies [EodOutcome, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() =>
              run(() =>
                applyEndOfDayOutcomeAction({
                  outcome: value,
                  planItemId: item.planItem!.id,
                }),
              )
            }
            className="border-border text-muted rounded-lg border px-3 py-2 text-xs font-bold"
          >
            {label}
          </button>
        ))}
        <input
          type="date"
          value={deferDate}
          onChange={(e) => setDeferDate(e.target.value)}
          className="border-border rounded-lg border px-3 text-xs"
        />
        <button
          onClick={() =>
            run(() =>
              applyEndOfDayOutcomeAction({
                outcome: "deferred",
                deferredDate: deferDate,
                planItemId: item.planItem!.id,
              }),
            )
          }
          className="border-border text-muted rounded-lg border px-3 py-2 text-xs font-bold"
        >
          Plan for date
        </button>
      </div>
    </article>
  );
}
function FollowUpReview({
  followUps,
  pending,
  run,
  onContinue,
}: {
  followUps: EodFollowUp[];
  pending: boolean;
  run: Runner;
  onContinue: () => void;
}) {
  return (
    <div>
      <h2 className="text-ink text-2xl font-bold">Review follow-ups</h2>
      <p className="text-muted mt-2 text-sm">
        Due and overdue items need a decision.
      </p>
      <div className="mt-7 space-y-4">
        {followUps.length ? (
          followUps.map((followUp) => (
            <FollowUpRow key={followUp.id} followUp={followUp} run={run} />
          ))
        ) : (
          <p className="bg-success-surface text-success-ink rounded-lg p-5 text-sm">
            No follow-ups need a decision today.
          </p>
        )}
      </div>
      <div className="mt-8 flex justify-between">
        <button
          onClick={onContinue}
          disabled={pending || followUps.length > 0}
          className="bg-lavender-700 ml-auto rounded-lg px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
function FollowUpRow({
  followUp,
  run,
}: {
  followUp: EodFollowUp;
  run: Runner;
}) {
  const [date, setDate] = useState("");
  return (
    <article className="border-border rounded-lg border p-5">
      <p className="text-ink text-sm font-bold">{followUp.title}</p>
      <p className="text-muted mt-1 text-sm">{followUp.reason}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border-border rounded-lg border px-3 text-xs"
        />
        <button
          onClick={() =>
            run(() =>
              resolveEndOfDayFollowUpAction({
                decision: "still_waiting",
                followUpId: followUp.id,
                reviewOn: date,
              }),
            )
          }
          className="border-border rounded-lg border px-3 py-2 text-xs font-bold"
        >
          Still waiting
        </button>
        {(
          [
            ["response_received", "Response received"],
            ["external_completed", "External change completed"],
            ["no_longer_relevant", "No longer relevant"],
          ] satisfies [FollowUpDecision, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() =>
              run(() =>
                resolveEndOfDayFollowUpAction({
                  decision: value,
                  followUpId: followUp.id,
                }),
              )
            }
            className="border-border rounded-lg border px-3 py-2 text-xs font-bold"
          >
            {label}
          </button>
        ))}
      </div>
    </article>
  );
}
