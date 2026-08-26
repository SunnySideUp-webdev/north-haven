import { z } from "zod";

const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(10_000).optional();
const trackingState = z.enum(["active", "watching", "closed", "archived"]);
const operationalStatus = z.enum([
  "pending",
  "in_progress",
  "waiting_response",
  "resolved",
]);
const systemPriority = z.enum(["urgent", "high", "medium", "low"]);
const isoDateTime = z.string().datetime({ offset: true });

export const ticketInputSchema = z
  .object({
    description,
    externalUrl: z.union([
      z.literal(""),
      z.string().trim().url().startsWith("https://"),
    ]),
    formBackupComplete: z.boolean(),
    isTrackingTicket: z.boolean().default(false),
    note: z.string().trim().max(10_000).optional(),
    operationalStatus,
    receivedAt: z.string().date(),
    systemPriority,
    ticketNumber: z.string().trim().max(80),
    ticketTypeId: z.string().uuid(),
    title,
    trackingState: trackingState.optional(),
    workItemId: z.string().uuid().optional(),
  })
  .superRefine((ticket, context) => {
    if (!ticket.isTrackingTicket && ticket.ticketNumber.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Ticket number is required.",
        path: ["ticketNumber"],
      });
    }
  });

export const ticketWorkflowInputSchema = z.object({
  operationalStatus,
  systemPriority,
  trackingState,
  workItemId: z.string().uuid(),
});

export const bulkTicketImportInputSchema = z.object({
  tickets: z
    .array(
      z.object({
        category: z.string().trim().max(500).optional(),
        createdLabel: z.string().trim().max(120).optional(),
        operationalStatus,
        receivedAt: z.string().date(),
        requesterEmail: z.string().trim().email().optional(),
        requesterName: z.string().trim().max(200).optional(),
        sourceStatus: z.string().trim().min(1).max(80),
        systemPriority,
        ticketNumber: z.string().trim().min(1).max(80),
        ticketTypeId: z.string().uuid(),
        title,
      }),
    )
    .min(1)
    .max(100),
});

export const taskInputSchema = z.object({
  description,
  dueAt: z.union([z.literal(""), isoDateTime]),
  title,
  trackingState: trackingState.optional(),
  workItemId: z.string().uuid().optional(),
});

export const reminderInputSchema = z.object({
  description,
  remindAt: isoDateTime,
  title,
  trackingState: trackingState.optional(),
  workItemId: z.string().uuid().optional(),
});

export const noteInputSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
  workItemId: z.string().uuid(),
});

export const followUpInputSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  reviewOn: z.union([z.literal(""), z.string().date()]),
  waitingOn: z.string().trim().max(200).optional(),
  workItemId: z.string().uuid(),
});

export const createTicketTypeInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const manageTicketTypeInputSchema = z.object({
  direction: z.union([z.literal("-1"), z.literal("1")]).optional(),
  intent: z.enum(["save", "move"]),
  isActive: z.boolean(),
  name: z.string().trim().min(1).max(80),
  ticketTypeId: z.string().uuid(),
});

export const transitionFollowUpInputSchema = z.object({
  followUpId: z.string().uuid(),
  state: z.enum(["completed", "cancelled"]),
  workItemId: z.string().uuid(),
});
