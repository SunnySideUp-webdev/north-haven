"use client";

import { useFormStatus } from "react-dom";

export const fieldClassName =
  "border-border bg-paper text-ink placeholder:text-quiet focus:border-lavender-500 w-full rounded-xl border px-4 py-3 text-[15px] outline-none";

export function SubmitButton({
  children,
  pendingLabel,
}: Readonly<{
  children: React.ReactNode;
  pendingLabel: string;
}>) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-lavender-700 hover:bg-lavender-500 mt-2 w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({
  message,
  status,
}: Readonly<{
  message?: string;
  status: "idle" | "error" | "success";
}>) {
  if (!message) {
    return null;
  }

  return (
    <p
      role={status === "error" ? "alert" : "status"}
      className={
        status === "error"
          ? "bg-urgent-surface text-urgent-ink rounded-xl px-4 py-3 text-sm"
          : "bg-success-surface text-success-ink rounded-xl px-4 py-3 text-sm"
      }
    >
      {message}
    </p>
  );
}
