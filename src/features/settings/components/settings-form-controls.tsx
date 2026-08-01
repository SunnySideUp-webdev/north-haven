"use client";

import { useFormStatus } from "react-dom";

export const settingsFieldClassName =
  "border-border bg-paper text-ink focus:border-lavender-500 mt-2 w-full rounded-lg border px-4 py-3 text-sm outline-none";

export function SettingsSubmitButton({
  label,
  pendingLabel = "Saving…",
  variant = "primary",
}: {
  label: string;
  pendingLabel?: string;
  variant?: "danger" | "primary";
}) {
  const { pending } = useFormStatus();
  const className =
    variant === "danger"
      ? "border-urgent-ink text-urgent-ink min-h-11 rounded-lg border px-5 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
      : "bg-lavender-700 hover:bg-lavender-500 min-h-11 rounded-lg px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60";

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function SettingsMessage({
  message,
  status,
}: {
  message?: string;
  status: "idle" | "error" | "success";
}) {
  if (!message) return null;

  return (
    <p
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
      className={
        status === "error"
          ? "bg-urgent-surface text-urgent-ink rounded-lg px-4 py-3 text-sm"
          : "bg-success-surface text-success-ink rounded-lg px-4 py-3 text-sm"
      }
    >
      {message}
    </p>
  );
}
