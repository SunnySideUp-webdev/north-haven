"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SearchResult = {
  id: string;
  kind: string;
  match_reason: string;
  operational_status: string | null;
  ticket_number: string | null;
  ticket_type_name: string | null;
  title: string;
  tracking_state: string;
};

const label = (value: string | null) =>
  value
    ?.replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "—";

export function GlobalSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "f"
      ) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setMessage("Enter at least two characters.");
      return;
    }
    setLoading(true);
    setMessage(undefined);
    try {
      const response = await fetch("/api/work-search", {
        body: JSON.stringify({ includeArchived, query }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        results?: SearchResult[];
      };
      if (!response.ok) throw new Error(payload.message);
      setResults(payload.results ?? []);
      if (!payload.results?.length) setMessage("No matching work found.");
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't search your workspace.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:text-ink flex h-17 items-center gap-2"
      >
        Search
        <kbd className="border-border text-quiet rounded border px-1.5 py-0.5 text-[9px]">
          ⇧⌘F
        </kbd>
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-6 pt-[10vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Search North Haven"
            className="border-border bg-paper shadow-surface w-full max-w-3xl rounded-2xl border"
          >
            <form
              onSubmit={search}
              className="border-border flex items-center gap-3 border-b p-5"
            >
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tickets, tasks, reminders, types, notes, or links"
                className="border-border bg-canvas text-ink min-w-0 flex-1 rounded-lg border px-4 py-3 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-lavender-700 rounded-lg px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {loading ? "Searching…" : "Search"}
              </button>
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setOpen(false)}
                className="text-muted px-2 text-xl"
              >
                ×
              </button>
            </form>
            <div className="flex items-center justify-between px-5 py-3">
              <label className="text-muted flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(event) => setIncludeArchived(event.target.checked)}
                />{" "}
                Include archived
              </label>
              <span className="text-quiet text-xs">
                Exact ticket numbers appear first.
              </span>
            </div>
            <div className="max-h-[55vh] overflow-y-auto px-5 pb-5">
              {message ? (
                <p
                  role="status"
                  className="text-muted bg-lavender-50 rounded-lg px-4 py-4 text-sm"
                >
                  {message}
                </p>
              ) : null}
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/work/${result.id}`}
                  onClick={() => setOpen(false)}
                  className="border-border hover:bg-lavender-50 flex items-center gap-4 border-t px-3 py-4 first:border-t-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-sm font-bold">
                      {result.ticket_number ? `${result.ticket_number} · ` : ""}
                      {result.title}
                    </p>
                    <p className="text-quiet mt-1 text-xs">
                      {label(result.kind)}
                      {result.ticket_type_name
                        ? ` · ${result.ticket_type_name}`
                        : ""}{" "}
                      · matched in {result.match_reason.toLowerCase()}
                    </p>
                  </div>
                  <span className="bg-lavender-100 text-lavender-700 rounded-full px-3 py-1 text-xs font-bold">
                    {label(result.tracking_state)}
                  </span>
                  {result.operational_status ? (
                    <span className="text-quiet text-xs">
                      {label(result.operational_status)}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
