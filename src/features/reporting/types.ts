export type DailyMetric = {
  completedItems: number;
  dayNote: string | null;
  deferredItems: number;
  hasImportantNote: boolean;
  isOutOfOffice: boolean;
  meetingsAttended: number;
  planIntention: string | null;
  plannedItems: number;
  planStatus: string | null;
  remindersCompleted: number;
  returnedItems: number;
  skippedItems: number;
  tasksCompleted: number;
  ticketsClosed: number;
  ticketsResolved: number;
  ticketsWorked: number;
  workDate: string;
};

export type MonthlyCalendarView = {
  currentMonth: string;
  gridEnd: string;
  gridStart: string;
  monthEnd: string;
  monthKey: string;
  monthNote: string;
  monthStart: string;
  rows: DailyMetric[];
  timeZone: string;
  today: string;
};
