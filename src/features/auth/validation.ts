import { z } from "zod";

const email = z.string().trim().email().max(254);
const password = z.string().min(12).max(128);
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

export const signInSchema = z.object({ email, password });

export const createAccountSchema = z
  .object({
    confirmPassword: password,
    email,
    password,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export const emailSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({ confirmPassword: password, password })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export const setupSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80),
    endsAtLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    startsAtLocal: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    timeZone,
    workingWeekdays: z.array(z.coerce.number().int().min(1).max(7)).min(1),
  })
  .refine((value) => value.endsAtLocal > value.startsAtLocal, {
    message: "Workday end must be later than the start.",
    path: ["endsAtLocal"],
  });
