import { z } from "zod";

const timeZone = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  });

export const profileSettingsSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
});

export const workScheduleSettingsSchema = z
  .object({
    endsAtLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    startsAtLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    timeZone,
    workingWeekdays: z.array(z.coerce.number().int().min(1).max(7)).min(1),
  })
  .refine((value) => value.endsAtLocal > value.startsAtLocal, {
    message: "Workday end must be later than the start.",
    path: ["endsAtLocal"],
  });

export const manualNonWorkingDaySchema = z.object({
  kind: z.enum(["holiday", "manual"]),
  workDate: z.string().date(),
});

export const manualNonWorkingDayIdSchema = z.string().uuid();

export const settingsPasswordSchema = z
  .object({
    confirmPassword: z.string().min(12).max(128),
    password: z.string().min(12).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });
