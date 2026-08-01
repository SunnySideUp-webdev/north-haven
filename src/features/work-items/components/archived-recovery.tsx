"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { restoreArchivedWorkItemAction } from "@/features/work-items/actions";

export function ArchivedRecovery({ workItemId }: { workItemId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setMessage(undefined);
            const result = await restoreArchivedWorkItemAction(workItemId);
            if (!result.ok) setMessage(result.message);
            else router.refresh();
          })
        }
        className="bg-lavender-700 hover:bg-lavender-500 rounded-lg px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Restoring…" : "Restore to Active"}
      </button>
      {message ? (
        <p role="alert" className="text-urgent-ink mt-2 text-xs">
          {message}
        </p>
      ) : null}
    </div>
  );
}
