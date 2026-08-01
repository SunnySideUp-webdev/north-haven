"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setPlanSelectionAction } from "@/features/daily-planning/actions";

export function AddToPlan({
  defaultDate,
  workItemId,
}: {
  defaultDate: string;
  workItemId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [workDate, setWorkDate] = useState(defaultDate);
  const [message, setMessage] = useState<string>();

  return (
    <div className="flex items-center gap-2">
      <input
        aria-label="Plan date"
        type="date"
        value={workDate}
        onChange={(event) => setWorkDate(event.target.value)}
        className="border-border bg-paper text-muted rounded-lg border px-3 py-2.5 text-sm"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(undefined);
          startTransition(async () => {
            const result = await setPlanSelectionAction({
              selected: true,
              workDate,
              workItemId,
            });
            setMessage(result.ok ? "Added" : result.message);
            router.refresh();
          });
        }}
        className="border-lavender-300 bg-paper text-lavender-700 rounded-lg border px-4 py-2.5 text-sm font-bold disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add to plan"}
      </button>
      {message ? <span className="text-quiet text-xs">{message}</span> : null}
    </div>
  );
}
