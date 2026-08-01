"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  changeSettingsPasswordAction,
  signOutEverywhereAction,
} from "@/features/settings/actions";
import {
  SettingsMessage,
  SettingsSubmitButton,
  settingsFieldClassName,
} from "@/features/settings/components/settings-form-controls";
import { initialSettingsActionState } from "@/features/settings/types";

export function SecuritySettings({ email }: { email: string }) {
  const passwordForm = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(
    changeSettingsPasswordAction,
    initialSettingsActionState,
  );
  const [sessionState, sessionAction] = useActionState(
    signOutEverywhereAction,
    initialSettingsActionState,
  );

  useEffect(() => {
    if (state.status === "success") passwordForm.current?.reset();
  }, [state.status]);

  return (
    <section
      id="security"
      className="border-border/70 bg-paper shadow-surface rounded-xl border p-8"
    >
      <p className="text-blush-600 text-xs font-bold tracking-[0.12em] uppercase">
        Account protection
      </p>
      <h2 className="text-ink mt-2 text-xl font-bold">Security</h2>
      <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
        Manage the password and authenticated sessions for {email}.
      </p>

      <form
        ref={passwordForm}
        action={action}
        className="mt-7 max-w-2xl space-y-5"
      >
        <SettingsMessage message={state.message} status={state.status} />
        <div className="grid grid-cols-2 gap-5">
          <label className="text-ink block text-sm font-bold">
            New password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              className={settingsFieldClassName}
            />
          </label>
          <label className="text-ink block text-sm font-bold">
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              className={settingsFieldClassName}
            />
          </label>
        </div>
        <div className="border-border flex justify-end border-t pt-6">
          <SettingsSubmitButton
            label="Update password"
            pendingLabel="Updating…"
          />
        </div>
      </form>

      <div className="border-border mt-9 border-t pt-8">
        <h3 className="text-ink text-base font-bold">Authenticated sessions</h3>
        <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
          If you no longer recognize a signed-in computer, sign out every North
          Haven session. You will need your password to return.
        </p>
        <div className="mt-5 max-w-2xl">
          <SettingsMessage
            message={sessionState.message}
            status={sessionState.status}
          />
        </div>
        <form
          action={sessionAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Sign out every North Haven session, including this one?",
              )
            ) {
              event.preventDefault();
            }
          }}
          className="mt-5"
        >
          <SettingsSubmitButton
            label="Sign out everywhere"
            pendingLabel="Signing out…"
            variant="danger"
          />
        </form>
      </div>
    </section>
  );
}
