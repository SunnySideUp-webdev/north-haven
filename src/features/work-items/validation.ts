import { z } from "zod";

const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(10_000).optional();
const trackingState = z.enum(["active", "watching", "closed", "archived"]);
const isoDateTime = z.string().datetime({ offset: true });

export const ticketInputSchema = z.object({
  description,
  externalUrl: z.union([
    z.literal(""),
    z.string().trim().url().startsWith("https://"),
  ]),
  formBackupComplete: z.boolean(),
  note: z.string().trim().max(10_000).optional(),
  operationalStatus: z.enum([
    "pending",
    "in_progress",
    "waiting_response",
    "resolved",
  ]),
  receivedAt: z.string().date(),
  systemPriority: z.enum(["urgent", "high", "medium", "low"]),
  ticketNumber: z.string().trim().min(1).max(80),
  ticketTypeId: z.string().uuid(),
  title,
  trackingState: trackingState.optional(),
  workItemId: z.string().uuid().optional(),
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
