export type SettingsActionState = {
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialSettingsActionState: SettingsActionState = {
  status: "idle",
};

export type ManualNonWorkingDay = {
  id: string;
  kind: "holiday" | "manual";
  workDate: string;
};

export type SettingsOverview = {
  email: string;
  profile: {
    displayName: string;
    timeZone: string;
  };
  schedule: {
    endsAtLocal: string;
    startsAtLocal: string;
    timeZone: string;
    workingWeekdays: number[];
  };
  manualNonWorkingDays: ManualNonWorkingDay[];
  today: string;
};
