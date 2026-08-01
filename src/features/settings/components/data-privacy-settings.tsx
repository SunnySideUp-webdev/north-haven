"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  workspaceBackupSchema,
  type WorkspaceBackup,
} from "@/features/settings/workspace-backup";

type RestoreResult = {
  calendar_outcomes_applied: number;
  calendar_outcomes_waiting: number;
  daily_plans: number;
  work_items: number;
};

export function DataPrivacySettings() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<WorkspaceBackup>();
  const [filename, setFilename] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [pending, setPending] = useState<"download" | "restore">();
  const [message, setMessage] = useState<{
    kind: "error" | "success";
    text: string;
  }>();

  async function downloadBackup() {
    setPending("download");
    setMessage(undefined);
    try {
      const response = await fetch("/api/workspace-backup", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const name =
        /filename="([^"]+)"/.exec(disposition)?.[1] ??
        "north-haven-workspace.json";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = name;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage({ kind: "success", text: "Workspace backup downloaded." });
    } catch {
      setMessage({
        kind: "error",
        text: "We couldn't download your workspace backup.",
      });
    } finally {
      setPending(undefined);
    }
  }

  async function chooseBackup(file?: File) {
    setBackup(undefined);
    setFilename(file?.name ?? "");
    setMessage(undefined);
    if (!file) return;
    if (file.size > 10_485_760) {
      setMessage({
        kind: "error",
        text: "Choose a backup smaller than 10 MB.",
      });
      return;
    }
    try {
      const parsed = workspaceBackupSchema.safeParse(
        JSON.parse(await file.text()),
      );
      if (!parsed.success) throw new Error();
      setBackup(parsed.data);
    } catch {
      setMessage({
        kind: "error",
        text: "This is not a supported North Haven workspace backup.",
      });
    }
  }

  async function restoreBackup() {
    if (!backup || !understood || confirmation !== "RESTORE NORTH HAVEN")
      return;
    setPending("restore");
    setMessage(undefined);
    try {
      const response = await fetch("/api/workspace-backup", {
        body: JSON.stringify({ backup, confirmation }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as RestoreResult & {
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message);
      setMessage({
        kind: "success",
        text: `Workspace restored: ${payload.work_items} work items and ${payload.daily_plans} daily plans.`,
      });
      setBackup(undefined);
      setFilename("");
      setConfirmation("");
      setUnderstood(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof Error && error.message
            ? error.message
            : "We couldn't restore this backup. Your current workspace was not changed.",
      });
    } finally {
      setPending(undefined);
    }
  }

  return (
    <section
      id="data-and-privacy"
      className="border-border/70 bg-paper shadow-surface rounded-xl border p-8"
    >
      <p className="text-blush-600 text-xs font-bold tracking-[0.12em] uppercase">
        Private by default
      </p>
      <h2 className="text-ink mt-2 text-xl font-bold">Data and privacy</h2>
      <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
        Reports and backups are generated on demand and are not retained by
        North Haven. Keep downloaded files somewhere private.
      </p>

      <div className="bg-lavender-50 mt-7 rounded-xl p-6">
        <h3 className="text-ink text-base font-bold">Workspace backup</h3>
        <p className="text-muted mt-2 text-sm leading-6">
          Download a versioned JSON copy of your settings, inventory, notes,
          plans, history, and confirmed meeting outcomes. Passwords, sessions,
          and Google OAuth tokens are never included.
        </p>
        <button
          type="button"
          disabled={Boolean(pending)}
          onClick={downloadBackup}
          className="bg-lavender-700 mt-5 rounded-lg px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending === "download"
            ? "Preparing backup…"
            : "Download workspace backup"}
        </button>
      </div>

      <div className="border-border mt-8 border-t pt-7">
        <h3 className="text-ink text-base font-bold">Restore workspace</h3>
        <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
          Restoration replaces your current North Haven content in one
          transaction. Your Google connection remains in place; provider events
          are synced again and recovered meeting outcomes are matched safely.
        </p>
        <label className="text-ink mt-5 block text-sm font-bold">
          North Haven backup file
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => chooseBackup(event.target.files?.[0])}
            className="border-border text-muted mt-2 block w-full rounded-lg border px-4 py-3 text-sm"
          />
        </label>
        {backup ? (
          <p className="text-muted mt-3 text-sm">
            Ready: {filename} · {backup.tables.work_items.length} work items ·{" "}
            {backup.tables.daily_plans.length} daily plans
          </p>
        ) : null}
        <label className="text-muted mt-5 flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            checked={understood}
            onChange={(event) => setUnderstood(event.target.checked)}
            className="accent-lavender-700 mt-1"
          />
          I understand that this replaces my current workspace content.
        </label>
        <label className="text-ink mt-4 block text-sm font-bold">
          Type RESTORE NORTH HAVEN to confirm
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            className="border-border mt-2 w-full rounded-lg border px-4 py-3"
          />
        </label>
        <button
          type="button"
          disabled={
            Boolean(pending) ||
            !backup ||
            !understood ||
            confirmation !== "RESTORE NORTH HAVEN"
          }
          onClick={restoreBackup}
          className="bg-urgent-ink mt-5 rounded-lg px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          {pending === "restore" ? "Restoring workspace…" : "Restore workspace"}
        </button>
      </div>

      <div className="border-border mt-8 border-t pt-7">
        <h3 className="text-ink text-base font-bold">Report privacy</h3>
        <p className="text-muted mt-2 text-sm leading-6">
          Ticket titles, day notes, and follow-up reasons remain excluded until
          you explicitly include them in a report.
        </p>
        <Link
          href="/insights/reports"
          className="text-lavender-700 mt-4 inline-block text-sm font-bold"
        >
          Open Report Builder →
        </Link>
      </div>

      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`mt-6 rounded-lg px-4 py-3 text-sm ${message.kind === "error" ? "bg-urgent-surface text-urgent-ink" : "bg-success-surface text-success-ink"}`}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
