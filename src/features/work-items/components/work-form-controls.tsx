"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

export const workFieldClassName =
  "border-border bg-paper text-ink placeholder:text-quiet focus:border-lavender-500 mt-2 w-full rounded-lg border px-4 py-3 text-sm outline-none";

export function WorkFormMessage({
  existingWorkItemId,
  message,
}: {
  existingWorkItemId?: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="bg-urgent-surface text-urgent-ink rounded-lg px-4 py-3 text-sm"
    >
      <span>{message}</span>
      {existingWorkItemId ? (
        <Link
          href={`/work/${existingWorkItemId}`}
          className="ml-3 font-bold underline underline-offset-2"
        >
          Open existing
        </Link>
      ) : null}
    </div>
  );
}

export function WorkSubmitButton({
  label,
  name,
  value,
  variant = "primary",
}: {
  label: string;
  name?: string;
  value?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`${variant === "primary" ? "bg-lavender-700 hover:bg-lavender-500 text-white" : "border-border bg-paper text-muted border"} min-h-11 rounded-lg px-6 text-sm font-bold disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
