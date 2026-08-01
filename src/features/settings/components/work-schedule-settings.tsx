"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  addManualNonWorkingDayAction,
  removeManualNonWorkingDayAction,
  saveWorkScheduleAction,
} from "@/features/settings/actions";
import {
  SettingsMessage,
  SettingsSubmitButton,
  settingsFieldClassName,
} from "@/features/settings/components/settings-form-controls";
import {
  initialSettingsActionState,
  type ManualNonWorkingDay,
} from "@/features/settings/types";

const weekdays = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

const commonTimeZones = [
  "America/Guatemala",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "UTC",
];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function WorkScheduleSettings({
  manualNonWorkingDays,
  schedule,
  today,
}: {
  manualNonWorkingDays: ManualNonWorkingDay[];
  schedule: {
    endsAtLocal: string;
    startsAtLocal: string;
    timeZone: string;
    workingWeekdays: number[];
  };
  today: string;
}) {
  const router = useRouter();
  const [scheduleState, scheduleAction] = useActionState(
    saveWorkScheduleAction,
    initialSettingsActionState,
  );
  const [dayState, dayAction] = useActionState(
    addManualNonWorkingDayAction,
    initialSettingsActionState,
  );
  const [removalMessage, setRemovalMessage] = useState<string>();
  const [removing, startRemoving] = useTransition();

  function removeDay(id: string) {
    setRemovalMessage(undefined);
    startRemoving(async () => {
      const result = await removeManualNonWorkingDayAction(id);
      setRemovalMessage(result.message);
      router.refresh();
    });
  }

  return (
    <section
      id="work-schedule"
      className="border-border/70 bg-paper shadow-surface rounded-xl border p-8"
    >
      <p className="text-blush-600 text-xs font-bold tracking-[0.12em] uppercase">
        Planning foundation
      </p>
      <h2 className="text-ink mt-2 text-xl font-bold">Work schedule</h2>
      <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
        North Haven uses this schedule to find your next workday, interpret
        dates, and calculate calm daily averages.
      </p>

      <form action={scheduleAction} className="mt-7 space-y-7">
        <SettingsMessage
          message={scheduleState.message}
          status={scheduleState.status}
        />
        <fieldset>
          <legend className="text-ink text-sm font-bold">Working days</legend>
          <div className="mt-3 grid max-w-2xl grid-cols-7 gap-2">
            {weekdays.map((day) => (
              <label
                key={day.value}
                className="border-border has-checked:border-lavender-500 has-checked:bg-lavender-100 text-muted has-checked:text-lavender-700 flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-bold"
              >
                <input
                  name="workingWeekdays"
                  type="checkbox"
                  value={day.value}
                  defaultChecked={schedule.workingWeekdays.includes(day.value)}
                  className="sr-only"
                />
                {day.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid max-w-2xl grid-cols-2 gap-5">
          <label className="text-ink block text-sm font-bold">
            Workday start
            <input
              name="startsAtLocal"
              type="time"
              required
              defaultValue={schedule.startsAtLocal}
              className={settingsFieldClassName}
            />
          </label>
          <label className="text-ink block text-sm font-bold">
            Workday end
            <input
              name="endsAtLocal"
              type="time"
              required
              defaultValue={schedule.endsAtLocal}
              className={settingsFieldClassName}
            />
          </label>
        </div>

        <label className="text-ink block max-w-2xl text-sm font-bold">
          Time zone
          <input
            name="timeZone"
            required
            list="north-haven-time-zones"
            defaultValue={schedule.timeZone}
            className={settingsFieldClassName}
          />
          <datalist id="north-haven-time-zones">
            {commonTimeZones.map((timeZone) => (
              <option key={timeZone} value={timeZone} />
            ))}
          </datalist>
          <span className="text-quiet mt-2 block text-xs font-normal">
            Use an IANA time zone such as America/Guatemala.
          </span>
        </label>

        <div className="border-border flex justify-end border-t pt-6">
          <SettingsSubmitButton label="Save schedule" />
        </div>
      </form>

      <div className="border-border mt-9 border-t pt-8">
        <h3 className="text-ink text-base font-bold">Planning guidance</h3>
        <p className="text-muted mt-2 text-sm leading-6">
          Capacity guidance appears at 9 actionable items. Suggestions remain
          ordered by Urgent, follow-ups due, then oldest active work. North
          Haven never moves work automatically.
        </p>
      </div>

      <div className="border-border mt-9 border-t pt-8">
        <h3 className="text-ink text-base font-bold">Non-working days</h3>
        <p className="text-muted mt-2 text-sm leading-6">
          Add a personal holiday or another date North Haven should skip. Google
          Out of Office dates continue to sync automatically.
        </p>
        <form
          action={dayAction}
          className="bg-lavender-50 border-lavender-200 mt-5 rounded-lg border p-5"
        >
          <SettingsMessage
            message={dayState.message}
            status={dayState.status}
          />
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_200px_auto] items-end gap-4 first:mt-0">
            <label className="text-ink text-sm font-bold">
              Date
              <input
                name="workDate"
                type="date"
                min={today}
                required
                className={settingsFieldClassName}
              />
            </label>
            <label className="text-ink text-sm font-bold">
              Type
              <select name="kind" className={settingsFieldClassName}>
                <option value="holiday">Holiday</option>
                <option value="manual">Personal day</option>
              </select>
            </label>
            <SettingsSubmitButton label="Add day" pendingLabel="Adding…" />
          </div>
        </form>

        {removalMessage ? (
          <p role="status" className="text-muted mt-4 text-sm">
            {removalMessage}
          </p>
        ) : null}
        <div className="mt-5">
          {manualNonWorkingDays.length ? (
            manualNonWorkingDays.map((day) => (
              <div
                key={day.id}
                className="border-border flex items-center gap-4 border-t py-4 first:border-t-0"
              >
                <div>
                  <p className="text-ink text-sm font-bold">
                    {dateLabel(day.workDate)}
                  </p>
                  <p className="text-quiet mt-1 text-xs capitalize">
                    {day.kind === "manual" ? "Personal day" : day.kind}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => removeDay(day.id)}
                  className="text-urgent-ink ml-auto min-h-10 px-3 text-sm font-bold disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-quiet mt-5 text-sm">
              No manual non-working days are scheduled.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
