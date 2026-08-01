"use client";

import { useFormStatus } from "react-dom";

export const workFieldClassName =
  "border-border bg-paper text-ink placeholder:text-quiet focus:border-lavender-500 mt-2 w-full rounded-lg border px-4 py-3 text-sm outline-none";

export function WorkFormMessage({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="bg-urgent-surface text-urgent-ink rounded-lg px-4 py-3 text-sm"
    >
      {message}
    </p>
  );
}

export function WorkSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-lavender-700 hover:bg-lavender-500 min-h-11 rounded-lg px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
