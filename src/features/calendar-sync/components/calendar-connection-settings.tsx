"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  disconnectCalendarAction,
  setCalendarSelectedAction,
  syncCalendarAction,
} from "@/features/calendar-sync/actions";
import type { CalendarSettingsView } from "@/features/calendar-sync/types";

const resultMessages: Record<string, string> = {
  connected: "Google Calendar connected successfully.",
  denied:
    "Your organization did not allow this connection. You can continue without Calendar.",
  failed:
    "North Haven could not connect Google Calendar. Your work plans are still safe.",
  "invalid-state": "The secure connection request expired. Please try again.",
  "setup-required":
    "Google Calendar needs to be configured before it can connect.",
};

function lastSyncLabel(value: string | null) {
  if (!value) return "Not synced yet";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CalendarConnectionSettings({
  resultCode,
  settings,
}: {
  resultCode?: string;
  settings: CalendarSettingsView;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState(
    resultCode ? resultMessages[resultCode] : undefined,
  );

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await action();
      setMessage(result.message);
      router.refresh();
    });
  }

  const connection = settings.connection;
  const stateClassName = [
    "rounded-full px-3 py-1.5 text-xs font-bold capitalize",
    connection?.state === "connected"
      ? "bg-success-surface text-success-ink"
      : "bg-waiting-surface text-waiting-ink",
  ].join(" ");

  return (
    <section
      id="calendar-connection"
      className="border-border/70 bg-paper shadow-surface rounded-xl border p-8"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-blush-600 text-xs font-bold tracking-[0.12em] uppercase">
            Optional connection
          </p>
          <h2 className="text-ink mt-2 text-xl font-bold">Google Calendar</h2>
          <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
            See meetings and Out of Office time alongside your work plan. North
            Haven only requests read-only access and never changes Google
            events.
          </p>
        </div>
        {connection ? (
          <span className={stateClassName}>{connection.state}</span>
        ) : null}
      </div>

      {message ? (
        <p
          role="status"
          className="bg-lavender-50 text-lavender-700 mt-6 rounded-lg px-4 py-3 text-sm"
        >
          {message}
        </p>
      ) : null}

      {!settings.configured ? (
        <div className="border-lavender-200 bg-lavender-50 mt-7 rounded-xl border p-6">
          <h3 className="text-ink text-sm font-bold">Setup required</h3>
          <p className="text-muted mt-2 text-sm leading-6">
            Add the Google OAuth credentials to the server environment. No
            credentials or calendar tokens belong in GitHub.
          </p>
          <p className="text-quiet mt-4 text-xs">
            Authorized redirect URI:{" "}
            <code>http://127.0.0.1:3000/api/google-calendar/callback</code>
          </p>
        </div>
      ) : !connection ? (
        <div className="bg-blush-50 border-blush-200 mt-7 flex items-center justify-between gap-7 rounded-xl border p-6">
          <div>
            <h3 className="text-ink text-base font-bold">
              Connect Google Calendar
            </h3>
            <p className="text-muted mt-1 text-sm">
              You can choose your work Google account even when North Haven uses
              your personal sign-in.
            </p>
          </div>
          <a
            href="/api/google-calendar/connect"
            className="bg-lavender-700 hover:bg-lavender-500 shrink-0 rounded-lg px-5 py-3 text-sm font-bold text-white"
          >
            Connect Calendar
          </a>
        </div>
      ) : (
        <div className="mt-7">
          <div className="bg-lavender-50 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 rounded-xl p-6">
            <div>
              <p className="text-quiet text-xs font-bold tracking-[0.1em] uppercase">
                Connected account
              </p>
              <p className="text-ink mt-2 text-base font-bold">
                {connection.accountLabel}
              </p>
              <p className="text-muted mt-1 text-xs">
                Read-only access · Last sync{" "}
                {lastSyncLabel(connection.lastSyncedAt)}
              </p>
            </div>
            <button
              disabled={pending}
              onClick={() => run(syncCalendarAction)}
              className="border-lavender-500 text-lavender-700 rounded-lg border px-5 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {pending ? "Syncing…" : "Sync now"}
            </button>
          </div>

          <div className="mt-7">
            <h3 className="text-ink text-sm font-bold">Calendars to display</h3>
            <p className="text-muted mt-1 text-sm">
              Your primary work calendar is selected by default.
            </p>
            <div className="mt-4">
              {connection.calendars.map((calendar) => (
                <label
                  key={calendar.id}
                  className="border-border flex items-center gap-4 border-t py-4 first:border-t-0"
                >
                  <input
                    type="checkbox"
                    checked={calendar.isSelected}
                    disabled={pending}
                    onChange={(event) =>
                      run(() =>
                        setCalendarSelectedAction({
                          calendarId: calendar.id,
                          selected: event.target.checked,
                        }),
                      )
                    }
                    className="accent-lavender-700 h-4 w-4"
                  />
                  <span className="text-ink text-sm font-bold">
                    {calendar.name}
                  </span>
                  {calendar.isPrimary ? (
                    <span className="bg-blush-100 text-blush-600 rounded-full px-2.5 py-1 text-xs font-bold">
                      Primary
                    </span>
                  ) : null}
                  <span className="text-quiet ml-auto text-xs">
                    {calendar.timeZone ?? "Google time zone"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-border mt-6 flex items-center justify-between border-t pt-6">
            <a
              href="/api/google-calendar/connect"
              className="text-lavender-700 text-sm font-bold"
            >
              Reconnect or use another account
            </a>
            <button
              disabled={pending}
              onClick={() => {
                if (
                  window.confirm(
                    "Disconnect Google Calendar? Your work plans will remain available.",
                  )
                ) {
                  run(disconnectCalendarAction);
                }
              }}
              className="text-urgent-ink text-sm font-bold disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
