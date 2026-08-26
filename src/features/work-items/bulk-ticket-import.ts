import type {
  TicketOperationalStatus,
  TicketPriority,
} from "@/features/work-items/types";

export type ParsedTicketImport = {
  category?: string;
  createdLabel?: string;
  receivedAt: string;
  requesterEmail?: string;
  requesterName?: string;
  sourceStatus: string;
  systemPriority: TicketPriority;
  ticketNumber: string;
  ticketTypeName: string;
  title: string;
};

export type TicketImportDraft = ParsedTicketImport & {
  duplicate: boolean;
  ticketTypeId: string;
};

const priorityMap: Record<string, TicketPriority> = {
  high: "high",
  low: "low",
  medium: "medium",
  urgent: "urgent",
};

export function sourceStatusToOperationalStatus(
  status: string,
): TicketOperationalStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes("progress")) return "in_progress";
  if (normalized.includes("waiting")) return "waiting_response";
  if (normalized.includes("resolved")) return "resolved";
  return "pending";
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function receivedDateFromCreatedLabel(label: string | undefined, now: Date) {
  if (!label) return dateOnly(now);

  const relative = label
    .trim()
    .toLowerCase()
    .match(/^created\s+(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)\s+ago$/);

  if (!relative) return dateOnly(now);

  const amount = Number(relative[1]);
  const unit = relative[2];
  const received = new Date(now);

  if (unit.startsWith("day")) received.setDate(received.getDate() - amount);
  if (unit.startsWith("week")) received.setDate(received.getDate() - amount * 7);
  if (unit.startsWith("month"))
    received.setDate(received.getDate() - amount * 30);

  return dateOnly(received);
}

export function parseTicketSystemPaste(
  text: string,
  now = new Date(),
): ParsedTicketImport[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== "·");

  const tickets: ParsedTicketImport[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const match = line.match(
      /^([A-Za-z][A-Za-z\s-]*?)\s+(.+?)\s*\|\s*(.+?)\s+#(\d+)\s*$/,
    );

    if (!match) continue;

    const [, sourceStatus, ticketTypeName, title, ticketNumber] = match;

    const following = lines.slice(index + 1, index + 8);
    const createdLabel = following.find((value) =>
      /^Created\s+\d+\s+\w+\s+ago$/i.test(value),
    );
    const priority =
      following.find((value) => priorityMap[value.toLowerCase()]) ?? "Medium";
    const requesterEmail = following.find((value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    );
    const requesterName = requesterEmail
      ? following[following.indexOf(requesterEmail) - 1]
      : undefined;
    const category = following.find((value) => value.includes(" / "));

    tickets.push({
      category,
      createdLabel,
      receivedAt: receivedDateFromCreatedLabel(createdLabel, now),
      requesterEmail,
      requesterName:
        requesterName && !requesterName.includes("@") ? requesterName : undefined,
      sourceStatus: sourceStatus!.trim(),
      systemPriority: priorityMap[priority.toLowerCase()] ?? "medium",
      ticketNumber: ticketNumber!.trim(),
      ticketTypeName: ticketTypeName!.trim(),
      title: title!.trim(),
    });
  }

  const uniqueByNumber = new Map<string, ParsedTicketImport>();
  for (const ticket of tickets) {
    if (!uniqueByNumber.has(ticket.ticketNumber)) {
      uniqueByNumber.set(ticket.ticketNumber, ticket);
    }
  }

  return Array.from(uniqueByNumber.values());
}
