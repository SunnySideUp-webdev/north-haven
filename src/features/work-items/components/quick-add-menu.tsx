"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const quickActions = [
  {
    description: "Capture a source-system request and its workflow.",
    href: "/work/new/ticket",
    label: "New ticket",
  },
  {
    description: "Add normal work that is not tied to a ticket.",
    href: "/work/new/task",
    label: "New task",
  },
  {
    description: "Set a prompt for a specific date and time.",
    href: "/work/new/reminder",
    label: "New reminder",
  },
];

export function QuickAddMenu() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function openDialog() {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    triggerRef.current?.focus();
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openDialog();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDialog}
        className="hover:text-ink flex items-center gap-2"
        aria-haspopup="dialog"
      >
        Quick add
        <kbd className="border-border bg-canvas text-quiet rounded border px-1.5 py-0.5 text-[10px] font-bold">
          ⌘K
        </kbd>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="quick-add-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        className="backdrop:bg-ink/25 bg-paper border-border shadow-surface m-auto w-full max-w-[560px] rounded-2xl border p-0 backdrop:backdrop-blur-[2px]"
      >
        <div className="border-blush-200 bg-lavender-100 flex items-start justify-between border-b-2 px-7 py-6">
          <div>
            <h2
              id="quick-add-title"
              className="text-ink text-2xl font-bold tracking-[-0.03em]"
            >
              Quick add
            </h2>
            <p className="text-muted mt-2 text-sm">
              What would you like to capture?
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="text-muted hover:text-ink rounded-md px-2 py-1 text-sm font-bold"
            aria-label="Close quick add"
          >
            Close
          </button>
        </div>
        <div className="space-y-2 p-5">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => dialogRef.current?.close()}
              className="border-border hover:border-lavender-300 hover:bg-lavender-50 block rounded-xl border px-5 py-4"
            >
              <span className="text-ink block text-sm font-bold">
                {action.label}
              </span>
              <span className="text-muted mt-1 block text-xs leading-5">
                {action.description}
              </span>
            </Link>
          ))}
        </div>
      </dialog>
    </>
  );
}
