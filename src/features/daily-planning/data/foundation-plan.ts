import type { FoundationPlan } from "@/features/daily-planning/types";

export const foundationPlan: FoundationPlan = {
  workDate: new Date(),
  statusMessage: "Your day is ready",
  intention: "Finish the urgent form updates first",
  completedCount: 3,
  waitingCount: 6,
  dueFollowUpCount: 2,
  workItems: [
    {
      id: "ticket-1909",
      kind: "ticket",
      ticketNumber: "1909",
      title: "Update customer address",
      priority: "urgent",
      metadata: "Received today · first priority",
    },
    {
      id: "ticket-1731",
      kind: "ticket",
      ticketNumber: "1731",
      title: "Update form configuration",
      priority: "medium",
      metadata: "Medium · 12 days old",
    },
    {
      id: "ticket-1880",
      kind: "ticket",
      ticketNumber: "1880",
      title: "Review field mapping",
      priority: "medium",
      metadata: "Medium · 7 days old",
    },
    {
      id: "task-weekly-report",
      kind: "task",
      title: "Prepare weekly status report",
      metadata: "Task",
    },
    {
      id: "reminder-form-backup",
      kind: "reminder",
      title: "Check form backup",
      metadata: "Reminder",
    },
  ],
  meetings: [
    {
      id: "meeting-weekly-sync",
      title: "Weekly sync",
      time: "10:30–11:00 AM",
      source: "Google Calendar",
    },
    {
      id: "meeting-form-review",
      title: "Form review",
      time: "2:30–3:00 PM",
      source: "Google Calendar",
    },
  ],
};
