"use client";

import { useActionState } from "react";

import { saveProfileSettingsAction } from "@/features/settings/actions";
import {
  SettingsMessage,
  SettingsSubmitButton,
  settingsFieldClassName,
} from "@/features/settings/components/settings-form-controls";
import { initialSettingsActionState } from "@/features/settings/types";

export function ProfileSettings({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [state, action] = useActionState(
    saveProfileSettingsAction,
    initialSettingsActionState,
  );

  return (
    <section
      id="profile"
      className="border-border/70 bg-paper shadow-surface rounded-xl border p-8"
    >
      <p className="text-blush-600 text-xs font-bold tracking-[0.12em] uppercase">
        Personal workspace
      </p>
      <h2 className="text-ink mt-2 text-xl font-bold">Profile</h2>
      <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
        Choose how North Haven addresses you. Your sign-in email remains tied to
        the account that protects this workspace.
      </p>

      <form action={action} className="mt-7 max-w-2xl space-y-6">
        <SettingsMessage message={state.message} status={state.status} />
        <label className="text-ink block text-sm font-bold">
          Display name
          <input
            name="displayName"
            required
            maxLength={80}
            defaultValue={displayName}
            autoComplete="name"
            className={settingsFieldClassName}
          />
        </label>
        <label className="text-ink block text-sm font-bold">
          Sign-in email
          <input
            value={email}
            readOnly
            aria-describedby="email-help"
            className={`${settingsFieldClassName} bg-canvas text-muted`}
          />
          <span
            id="email-help"
            className="text-quiet mt-2 block text-xs font-normal"
          >
            Email changes are intentionally unavailable during the personal MVP.
          </span>
        </label>
        <div className="border-border flex justify-end border-t pt-6">
          <SettingsSubmitButton label="Save profile" />
        </div>
      </form>
    </section>
  );
}
