export type CalendarConnectionView = {
  accountLabel: string;
  calendars: {
    id: string;
    isPrimary: boolean;
    isSelected: boolean;
    name: string;
    timeZone: string | null;
  }[];
  lastSyncedAt: string | null;
  state: "connected" | "stale" | "disconnected" | "error";
};

export type CalendarSettingsView = {
  configured: boolean;
  connection: CalendarConnectionView | null;
};

export type CalendarMeetingView = {
  attendanceStatus:
    | "unconfirmed"
    | "probably_attended"
    | "attended"
    | "cancelled"
    | "did_not_attend"
    | "not_applicable";
  endsAt: string;
  id: string;
  meetingUrl: string | null;
  providerUrl: string | null;
  startsAt: string;
  title: string;
};

export type CalendarDayView = {
  connection: Pick<CalendarConnectionView, "lastSyncedAt" | "state"> | null;
  isOutOfOffice: boolean;
  meetings: CalendarMeetingView[];
};
