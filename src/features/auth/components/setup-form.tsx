"use client";

import { useActionState, useEffect, useRef } from "react";

import { completeSetupAction } from "@/features/auth/actions";
import {
  fieldClassName,
  FormMessage,
  SubmitButton,
} from "@/features/auth/components/form-controls";
import { initialAuthFormState } from "@/features/auth/types";

const weekdays = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

export function SetupForm({
  defaults,
}: Readonly<{
  defaults: {
    displayName: string;
    endsAtLocal: string;
    startsAtLocal: string;
    timeZone: string;
    workingWeekdays: number[];
  };
}>) {
  const [state, action] = useActionState(
    completeSetupAction,
    initialAuthFormState,
  );
  const timeZoneInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timeZoneInput.current && detectedTimeZone) {
      timeZoneInput.current.value = detectedTimeZone;
    }
  }, []);

  return (
    <form action={action} className="space-y-7">
      <FormMessage message={state.message} status={state.status} />
      <div className="grid grid-cols-2 gap-5">
        <label className="text-ink col-span-2 block text-sm font-bold">
          Display name
          <input
            name="displayName"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            defaultValue={defaults.displayName}
            className={`${fieldClassName} mt-2`}
          />
        </label>
        <label className="text-ink col-span-2 block text-sm font-bold">
          Time zone
          <input
            ref={timeZoneInput}
            name="timeZone"
            type="text"
            required
            defaultValue={defaults.timeZone}
            className={`${fieldClassName} mt-2`}
          />
          <span className="text-quiet mt-2 block text-xs font-normal">
            Detected from this computer. Use an IANA time zone if you change it.
          </span>
        </label>
      </div>

      <fieldset>
        <legend className="text-ink text-sm font-bold">Workdays</legend>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {weekdays.map((day) => (
            <label
              key={day.value}
              className="border-border has-checked:border-lavender-500 has-checked:bg-lavender-50 text-muted has-checked:text-lavender-700 flex cursor-pointer justify-center rounded-xl border px-2 py-3 text-sm font-bold"
            >
              <input
                name="workingWeekdays"
                type="checkbox"
                value={day.value}
                defaultChecked={defaults.workingWeekdays.includes(day.value)}
                className="sr-only"
              />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-5">
        <label className="text-ink block text-sm font-bold">
          Workday start
          <input
            name="startsAtLocal"
            type="time"
            required
            defaultValue={defaults.startsAtLocal}
            className={`${fieldClassName} mt-2`}
          />
        </label>
        <label className="text-ink block text-sm font-bold">
          Workday end
          <input
            name="endsAtLocal"
            type="time"
            required
            defaultValue={defaults.endsAtLocal}
            className={`${fieldClassName} mt-2`}
          />
        </label>
      </div>

      <div className="bg-lavender-50 border-lavender-200 rounded-2xl border px-5 py-4">
        <p className="text-ink text-sm font-bold">Google Calendar</p>
        <p className="text-muted mt-1 text-sm leading-5">
          Calendar connection is optional. We will add the corporate read-only
          connection from Settings in a later phase.
        </p>
      </div>

      <SubmitButton pendingLabel="Saving your workspace…">
        Finish setup
      </SubmitButton>
    </form>
  );
}
