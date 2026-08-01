export type WorkPriority = "urgent" | "high" | "medium" | "low";

export type PlannedWorkItem = {
  id: string;
  kind: "ticket" | "task" | "reminder";
  title: string;
  ticketNumber?: string;
  priority?: WorkPriority;
  metadata: string;
};

export type PlannedMeeting = {
  id: string;
  title: string;
  time: string;
  source: "Google Calendar" | "Manual";
};

export type FoundationPlan = {
  workDate: Date;
  statusMessage: string;
  intention: string;
  completedCount: number;
  waitingCount: number;
  dueFollowUpCount: number;
  workItems: PlannedWorkItem[];
  meetings: PlannedMeeting[];
};
