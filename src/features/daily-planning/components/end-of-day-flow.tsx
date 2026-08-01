"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveMeetingOutcomeAction } from "@/features/calendar-sync/actions";
import type {
  CalendarDayView,
  CalendarMeetingView,
} from "@/features/calendar-sync/types";
import {
  applyEndOfDayOutcomeAction,
  finishEndOfDayAction,
  reopenClosedDayAction,
  resolveEndOfDayFollowUpAction,
  saveDayNoteAction,
  savePlanDetailsAction,
  setEndOfDayStepAction,
  setPlanSelectionAction,
  type PlanningActionResult,
} from "@/features/daily-planning/actions";
import type { WorkInventoryRow } from "@/features/work-items/types";
import { PageHeader } from "@/shared/ui/page-header";

type EodItem = WorkInventoryRow & {
  planItem: { id: string; position: number; execution_status: string } | null;
};
type NextPlanningItem = WorkInventoryRow & {
  planItem: {
    id: string;
    position: number;
    execution_status: string;
    work_item_id: string;
  } | null;
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
    calendar: CalendarDayView;
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
    nextDayPlanning: {
      calendar: CalendarDayView;
      items: NextPlanningItem[];
      plan: { status: string; intention: string | null } | null;
    } | null;
    nextWorkDate: string | null;
    plan: {
      status: string;
      end_of_day_step: number;
      closed_at: string | null;
    } | null;
    timeZone: string;
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
  const [confirmReopen, setConfirmReopen] = useState(false);
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
          <section className="border-border bg-paper shadow-surface rounded-xl border p-10">
            <div className="text-center">
              <p className="text-muted">
                This day is closed and your next plan is ready when you return.
              </p>
            </div>
            <dl className="bg-lavender-50 mt-7 grid grid-cols-3 gap-5 rounded-xl p-6 text-center">
              <div>
                <dt className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
                  Planned
                </dt>
                <dd className="text-ink mt-2 text-2xl font-bold">
                  {planned.length}
                </dd>
              </div>
              <div>
                <dt className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
                  Completed
                </dt>
                <dd className="text-ink mt-2 text-2xl font-bold">
                  {
                    planned.filter(
                      (item) => item.planItem?.execution_status === "done",
                    ).length
                  }
                </dd>
              </div>
              <div>
                <dt className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
                  Moved or returned
                </dt>
                <dd className="text-ink mt-2 text-2xl font-bold">
                  {
                    planned.filter((item) =>
                      ["returned", "deferred", "skipped"].includes(
                        item.planItem?.execution_status ?? "",
                      ),
                    ).length
                  }
                </dd>
              </div>
            </dl>
            {data.nextDayPlanning ? (
              <div className="border-border mt-7 grid grid-cols-2 gap-6 border-t pt-6">
                <div>
                  <p className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
                    First focus
                  </p>
                  <p className="text-ink mt-2 text-sm font-bold">
                    {data.nextDayPlanning.items
                      .filter((item) => item.planItem)
                      .sort(
                        (a, b) => a.planItem!.position - b.planItem!.position,
                      )[0]?.title ?? "No focus selected"}
                  </p>
                </div>
                <div>
                  <p className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
                    First meeting
                  </p>
                  <p className="text-ink mt-2 text-sm font-bold">
                    {data.nextDayPlanning.calendar.meetings[0]?.title ??
                      "No meetings scheduled"}
                  </p>
                </div>
              </div>
            ) : null}
            {data.dayNote?.body ? (
              <div className="border-border mt-7 border-t pt-6">
                <p className="text-quiet text-xs font-bold tracking-[0.08em] uppercase">
                  Day note
                </p>
                <p className="text-muted mt-2 text-sm leading-6 whitespace-pre-wrap">
                  {data.dayNote.body}
                </p>
              </div>
            ) : null}
            {message ? (
              <p
                role="alert"
                className="bg-urgent-surface text-urgent-ink mt-6 rounded-lg px-4 py-3 text-sm"
              >
                {message}
              </p>
            ) : null}
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/today"
                className="bg-lavender-700 rounded-lg px-6 py-3 text-sm font-bold text-white"
              >
                Return to Today
              </Link>
              {!confirmReopen ? (
                <button
                  type="button"
                  onClick={() => setConfirmReopen(true)}
                  className="border-border text-muted rounded-lg border px-6 py-3 text-sm font-bold"
                >
                  Reopen this day
                </button>
              ) : null}
            </div>
            {confirmReopen ? (
              <div className="bg-blush-50 mt-6 rounded-xl p-5 text-center">
                <p className="text-ink text-sm font-bold">
                  Reopen this closed day?
                </p>
                <p className="text-muted mt-2 text-sm leading-6">
                  You can review its outcomes and close it again when the
                  summary is correct.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmReopen(false)}
                    className="text-muted px-4 py-2 text-sm font-bold"
                  >
                    Keep closed
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => reopenClosedDayAction({ workDate }),
                        () => setStep(2),
                      )
                    }
                    className="bg-lavender-700 rounded-lg px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {pending ? "Reopening…" : "Confirm reopen"}
                  </button>
                </div>
              </div>
            ) : null}
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
                  href={`/work/new/ticket?context=end-of-day&date=${workDate}&nextDate=${data.nextWorkDate ?? ""}`}
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
              meetings={data.calendar.meetings}
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
              timeZone={data.timeZone}
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
            <EodNextPlan
              data={data.nextDayPlanning}
              nextWorkDate={data.nextWorkDate}
              pending={pending}
              run={run}
              onBack={() => setStep(3)}
              onFinish={() => run(() => finishEndOfDayAction({ workDate }))}
              canFinish={unresolved === 0 && data.followUps.length === 0}
            />
          ) : null}
        </section>
      </div>
    </>
  );
}

function EodNextPlan({
  canFinish,
  data,
  nextWorkDate,
  onBack,
  onFinish,
  pending,
  run,
}: {
  canFinish: boolean;
  data: {
    items: NextPlanningItem[];
    plan: { status: string; intention: string | null } | null;
  } | null;
  nextWorkDate: string | null;
  onBack: () => void;
  onFinish: () => void;
  pending: boolean;
  run: Runner;
}) {
  const [search, setSearch] = useState("");
  if (!data || !nextWorkDate)
    return (
      <p className="text-muted">A next workday could not be calculated.</p>
    );

  const selected = data.items
    .filter((item) => item.planItem)
    .sort((a, b) => a.planItem!.position - b.planItem!.position);
  const query = search.trim().toLowerCase();
  const available = data.items
    .filter((item) => !item.planItem)
    .filter((item) =>
      [item.ticket_number, item.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    )
    .slice(0, 20);

  return (
    <div>
      <div className="flex items-start justify-between gap-5">
        <div>
          <h2 className="text-ink text-2xl font-bold">Plan next workday</h2>
          <p className="text-muted mt-2 text-sm">
            Choose tomorrow&apos;s focus here. Your next available workday is{" "}
            <strong>{nextWorkDate}</strong>.
          </p>
        </div>
        <span className="bg-lavender-100 text-lavender-700 rounded-full px-4 py-2 text-xs font-bold capitalize">
          {data.plan?.status ?? "Not started"}
        </span>
      </div>

      <section className="bg-lavender-50 mt-7 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-ink font-bold">Selected focus</h3>
          <span className="text-quiet text-sm">{selected.length} items</span>
        </div>
        <div className="mt-4">
          {selected.length ? (
            selected.map((item) => (
              <div
                key={item.id}
                className="border-lavender-200 flex items-center gap-3 border-t py-3 first:border-t-0"
              >
                <button
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  onClick={() =>
                    run(() =>
                      setPlanSelectionAction({
                        selected: false,
                        workDate: nextWorkDate,
                        workItemId: item.id!,
                      }),
                    )
                  }
                  className="border-lavender-500 bg-paper text-lavender-700 h-6 w-6 rounded border text-xs"
                >
                  ✓
                </button>
                <Link
                  href={`/work/${item.id}`}
                  className="text-ink text-sm font-bold"
                >
                  {item.ticket_number ? `${item.ticket_number} · ` : ""}
                  {item.title}
                </Link>
              </div>
            ))
          ) : (
            <p className="text-muted py-4 text-sm">
              Choose a few items below to make the next start effortless.
            </p>
          )}
        </div>
      </section>

      <section className="border-border mt-6 rounded-xl border">
        <div className="border-border flex items-center gap-3 border-b p-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search unplanned work"
            className="border-border bg-canvas min-w-0 flex-1 rounded-lg border px-4 py-2.5 text-sm"
          />
          <Link
            href={`/plan?date=${nextWorkDate}`}
            className="text-lavender-700 text-sm font-bold"
          >
            Open full Plan
          </Link>
        </div>
        <div className="max-h-64 overflow-y-auto px-5">
          {available.map((item) => (
            <div
              key={item.id}
              className="border-border flex items-center gap-3 border-t py-3 first:border-t-0"
            >
              <button
                type="button"
                aria-label={`Add ${item.title}`}
                onClick={() =>
                  run(() =>
                    setPlanSelectionAction({
                      selected: true,
                      workDate: nextWorkDate,
                      workItemId: item.id!,
                    }),
                  )
                }
                className="border-lavender-300 h-6 w-6 rounded border"
              />
              <p className="text-ink text-sm font-bold">
                {item.ticket_number ? `${item.ticket_number} · ` : ""}
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-7 flex items-center justify-between">
        <button onClick={onBack} className="text-muted text-sm font-bold">
          Back
        </button>
        <div className="flex gap-3">
          {data.plan?.status !== "ready" ? (
            <button
              type="button"
              disabled={pending || selected.length === 0}
              onClick={() =>
                run(() =>
                  savePlanDetailsAction({
                    intention: data.plan?.intention ?? "",
                    markReady: true,
                    workDate: nextWorkDate,
                  }),
                )
              }
              className="border-lavender-300 text-lavender-700 rounded-lg border px-5 py-3 text-sm font-bold disabled:opacity-40"
            >
              Mark plan ready
            </button>
          ) : null}
          <button
            disabled={pending || data.plan?.status !== "ready" || !canFinish}
            onClick={onFinish}
            className="bg-lavender-700 rounded-lg px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            Finish End of Day
          </button>
        </div>
      </div>
      {!canFinish ? (
        <p className="text-waiting-ink mt-4 text-right text-xs font-bold">
          Resolve today&apos;s open outcomes and due follow-ups before
          finishing.
        </p>
      ) : null}
    </div>
  );
}

function CloseToday({
  meetings,
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
  timeZone,
}: {
  meetings: CalendarMeetingView[];
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
  timeZone: string;
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
      {meetings.length ? (
        <MeetingReview meetings={meetings} run={run} timeZone={timeZone} />
      ) : null}
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

function MeetingReview({
  meetings,
  run,
  timeZone,
}: {
  meetings: CalendarMeetingView[];
  run: Runner;
  timeZone: string;
}) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  const options = [
    ["attended", "Attended"],
    ["did_not_attend", "Did not attend"],
    ["cancelled", "Cancelled"],
    ["not_applicable", "Not applicable"],
  ] as const;

  return (
    <div className="border-blush-200 mt-8 border-t pt-7">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-ink text-base font-bold">Confirm meetings</h3>
          <p className="text-muted mt-1 text-sm">
            Past meetings start as probably attended. Confirm only what needs a
            final outcome.
          </p>
        </div>
        <span className="text-blush-600 text-sm font-bold">
          {meetings.length}
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {meetings.map((meeting) => (
          <article
            key={meeting.id}
            className="border-blush-200 bg-blush-50 rounded-lg border p-5"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <h4 className="text-ink text-sm font-bold">{meeting.title}</h4>
                <p className="text-quiet mt-1 text-xs">
                  {formatter.format(new Date(meeting.startsAt))} ·{" "}
                  <span className="capitalize">
                    {meeting.attendanceStatus.replaceAll("_", " ")}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {options.map(([status, label]) => (
                <button
                  key={status}
                  onClick={() =>
                    run(() =>
                      saveMeetingOutcomeAction({
                        eventId: meeting.id,
                        status,
                      }),
                    )
                  }
                  className={[
                    "rounded-lg border px-3 py-2 text-xs font-bold",
                    meeting.attendanceStatus === status
                      ? "border-blush-300 bg-blush-100 text-blush-600"
                      : "border-border bg-paper text-muted",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </article>
        ))}
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
