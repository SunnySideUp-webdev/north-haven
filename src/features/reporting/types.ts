export const calendarDayColors = [
  "default",
  "lavender",
  "blush",
  "rose",
  "cream",
  "sage",
] as const;

export type CalendarDayColor = (typeof calendarDayColors)[number];
export type SavedCalendarDayColor = Exclude<CalendarDayColor, "default">;

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
  dayColors: Partial<Record<string, SavedCalendarDayColor>>;
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

export type InventoryMetric = {
  activeTickets: number;
  age0To7: number;
  age15To30: number;
  age31Plus: number;
  age8To14: number;
  averageActiveAge: number;
  ticketsReceived: number;
  waitingTickets: number;
  watchingTickets: number;
  workDate: string;
};

export type PeriodTotals = {
  completedItems: number;
  meetingsAttended: number;
  plannedItems: number;
  remindersCompleted: number;
  tasksCompleted: number;
  ticketsClosed: number;
  ticketsResolved: number;
  ticketsWorked: number;
};

export type WorkStatusSnapshot = {
  active: number;
  total: number;
  waiting: number;
  watching: number;
};

export type InsightsView = {
  daily: DailyMetric[];
  end: string;
  inventory: InventoryMetric[];
  isPartial: boolean;
  naturalEnd: string;
  period: import("@/features/reporting/date").InsightPeriod;
  previousTotals: PeriodTotals;
  start: string;
  timeZone: string;
  today: string;
  totals: PeriodTotals;
  workStatus: WorkStatusSnapshot;
  workingWeekdays: number[];
};
